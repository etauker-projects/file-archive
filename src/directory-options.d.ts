export interface DirectoryOptions<T=any> {
    directoryPath: string;
    parse?: (input: { [key: string]: string }) => T;
    regex?: RegExp;             // default: "(id) name [date].ext"
    matcher?: Partial<T>;       // { id, name, date }
}