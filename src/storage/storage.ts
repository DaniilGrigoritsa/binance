export interface KeyValueStore<T> {
    set(key: string, value: T): void;
    get(key: string): T | undefined;
    delete(key: string): void;
    has(key: string): boolean;
    clear(): void;
}

export class Storage<T> implements KeyValueStore<T> {
    private data: { [key: string]: T };

    constructor() {
        this.data = {};
    }

    set(key: string, value: T): void {
        this.data[key] = value;
    }

    get(key: string): T | undefined {
        return this.data[key];
    }

    delete(key: string): void {
        delete this.data[key];
    }

    has(key: string): boolean {
        return key in this.data;
    }

    clear(): void {
        this.data = {};
    }
}