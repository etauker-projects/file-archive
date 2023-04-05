import { Metadata } from './metadata.js';

export class FileContents<T> {
    metadata: Metadata;
    data: T;
}