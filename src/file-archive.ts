import path from 'path';
import { readdir, readFile, writeFile, stat, rm }  from 'node:fs/promises';
import { ArchiveOptions } from './archive-options.js';
import { DirectoryOptions } from './directory-options.js';
import { FileOptions } from './file-options.js';
import { FileContents } from './file-contents.js';

export class FileArchive {

    private static readonly currentArchiveVersion: 'json-archive.v1' = 'json-archive.v1';
    private options: ArchiveOptions;

    constructor(options: ArchiveOptions) {
        this.options = options;
    }

    public async list<T>(overrides: DirectoryOptions<T>): Promise<T[]> {

        const options = {
            regex: /\((?<id>.*?)\)\s*(?<name>.*?)\s*\[(?<date>.*?)\]\s*\.(.*)/u,
            parse: (input: { [key: string]: string }) => input as T,
            ...overrides,
        }

        // read directory
        const mergedPath = path.resolve(this.options.archivePath, options.directoryPath);
        const list = await readdir(mergedPath, { encoding: 'utf-8', withFileTypes: true });

        return list

            // filter by regex
            .filter((dirent: any) => {
                const name = path.resolve(mergedPath, dirent.name);
                return options.regex.test(name);
            })

            // match by regex
            .map((dirent: any) => {
                const name = path.resolve(mergedPath, dirent.name);
                const matches = name.match(options.regex);
                return { ...matches?.groups };
            })

            // parse data
            .map((object: { [key: string]: string }) => {
                return options.parse!(object);
            })

            // filter by values
            .filter((item: T) => {
                const keys = Object.keys(options.matcher || {}) as (keyof T)[];
                return keys.every(key => item[key] === options.matcher![key]);
            })
        ;
    }

    public async read<T>(options: FileOptions): Promise<FileContents<T>> {
        const mergedPath = path.resolve(this.options.archivePath, options.filePath);
        const contents = await readFile(mergedPath, { encoding: 'utf-8' }) as string;
        return JSON.parse(contents) as FileContents<T>;
    }

    public async save<T>(options: FileOptions, data: T): Promise<FileContents<T>> {
        const mergedPath = path.resolve(this.options.archivePath, options.filePath);
        const contents: FileContents<T> = {
            metadata: {
                archiveFormat: FileArchive.currentArchiveVersion,
                version: 'v1',  // TODO: expose this to the consumer
            },
            data,
        }
        await writeFile(mergedPath, JSON.stringify(contents), { encoding: 'utf-8' });
        return contents;
    }

    public async delete(options: FileOptions): Promise<boolean> {
        const mergedPath = path.resolve(this.options.archivePath, options.filePath);
        const exists = (await stat(mergedPath)).isFile();
        await rm(mergedPath);
        return exists;
    }

    // public async openWithDefaultApplication<T>(): Promise<void> {

    // }
}
