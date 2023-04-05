import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';
import { FileArchive } from './file-archive.js';

interface Entry {
    month: string;
    address: string;
    amount: number;
    company: string;
}

describe('FileArchive', () => {

    it('full flow', async () => {

        // INITIAL DATA
        const address = '123 Made Up Lane';
        const company = 'provider';
        const archivePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../test-data');
        const directoryPath = `${address}/Internet`;
        const archive = new FileArchive({ archivePath });
        const initialEntries: Entry[] = [
            { month: '01-2023', amount: 120, address, company },
            { month: '02-2023', amount: 160, address, company },
        ];

        // NEW DATA
        const newFileInfo: Entry = { month: '03-2023', amount: 180, address, company }
        const newFileData = { customer: 'John Doe', amount: newFileInfo.amount }
        const newFileName = `[${newFileInfo.month}] ${newFileInfo.company} (${newFileInfo.amount}).json`;
        const newFilePath = `${directoryPath}/${newFileName}`;
        
        // UPDATED DATA
        const updatedFileData = { ...newFileData, customer: 'Jane Doe' }

        // STEPS
        await list(archive, directoryPath, initialEntries);
        await create(archive, newFilePath, newFileData);
        await list(archive, directoryPath, [ ...initialEntries, newFileInfo ]);
        await read(archive, newFilePath, newFileData);
        await create(archive, newFilePath, updatedFileData);
        await read(archive, newFilePath, updatedFileData);
        await deleteFile(archive, newFilePath);
        await list(archive, directoryPath, initialEntries);
    })

    async function list(archive: FileArchive, directoryPath: string, expected: Entry[]): Promise<void> {
        const results = await archive.list<Entry>(
            {
                directoryPath,
                regex: /\/(?<root>.*)\/(?<address>.*?)\/Internet\/\[(?<month>.*?)\] (?<company>.*?) \((?<amount>.*?)\)\.(?<extension>json)/ui,
                parse: (input) => ({ month: input?.month, amount: parseFloat(input?.amount), address: input?.address, company: input?.company }),
            }
        );
        assert.equal(JSON.stringify(results), JSON.stringify(expected));
    }

    async function create(archive: FileArchive, filePath: string, data: any): Promise<void> {
        const saved = await archive.save({ filePath }, data);
        assert.equal(JSON.stringify(saved.data), JSON.stringify(data));
        assert.equal(JSON.stringify(saved.metadata), JSON.stringify({
            archiveFormat: 'json-archive.v1',
            version: 'v1',
        }));
    }

    async function read(archive: FileArchive, filePath: string, expected: any): Promise<void> {
        const contents = await archive.read<Entry>({ filePath });
        assert.equal(JSON.stringify(contents.data), JSON.stringify(expected));
        assert.equal(JSON.stringify(contents.metadata), JSON.stringify({
            archiveFormat: 'json-archive.v1',
            version: 'v1',
        }));
    }

    async function deleteFile(archive: FileArchive,filePath: string): Promise<void> {
        await archive.delete({ filePath });
    }

})