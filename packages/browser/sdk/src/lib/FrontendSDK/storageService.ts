class StorageService<T> {
    private useLocalStorage: boolean = false;
    private STORAGE_KEY = 'key';
    private container: T;
    constructor(initContent: T, storageKey?: string) {

        if (storageKey) {
            this.STORAGE_KEY = storageKey;
            this.useLocalStorage = true;
        }

        if (typeof window === 'undefined') {
            this.useLocalStorage = false;
        }

        this.container = initContent;
    }

    public get content(): T | null {
        if (this.useLocalStorage) {
            const _content = window.localStorage.getItem(this.STORAGE_KEY) as string ?? null;
            return JSON.parse(_content) as T;
        } else {
            return this.container;
        }
    }

    public set content(value: T) {
        if (this.useLocalStorage) {
            window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(value));
        } else {
            this.container = value;
        }
    }

    public remove() {
        if (this.useLocalStorage) {
            window.localStorage.removeItem(this.STORAGE_KEY);
        }
    }
}

export default StorageService;
