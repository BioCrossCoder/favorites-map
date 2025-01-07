import { TagData, indexStorageKey } from "@/interface";

export class Tag {
    public name: string;
    public labeledNodes: Set<string>;
    public constructor(name: string, labeledNodes: Set<string>) {
        this.name = name;
        this.labeledNodes = labeledNodes;
    }
}

const data = {} as Record<string, Tag>;

type IndexData = {
    records: TagData[],
    updateTime: number,
}

class IndexStorage {
    private static updateTime: Date = new Date();
    public static async load(): Promise<void> {
        const dataToLoad: IndexData | null = await storage.getItem(indexStorageKey);
        if (!dataToLoad) {
            return
        }
        dataToLoad.records.forEach((tag: TagData) => {
            data[tag.name] = new Tag(tag.name, new Set(tag.labeledNodes));
        });
        IndexStorage.updateTime = new Date(dataToLoad?.updateTime ?? new Date());
    }
    public static async dump(): Promise<void> {
        const dataToDump: IndexData = {
            records: Object.values(data).map((tag: Tag) => ({
                name: tag.name,
                labeledNodes: Array.from(tag.labeledNodes),
            })),
            updateTime: IndexStorage.updateTime.getTime(),
        }
        await storage.setItem(indexStorageKey, dataToDump);
    }
    private static _monitor(): void {
        storage.watch(indexStorageKey, IndexStorage.load);
    }
    public static syncStorageData(): void {
        storage.getItem(indexStorageKey).then(value => {
            if (!value) {
                IndexStorage.dump().then(IndexStorage._monitor);
            } else {
                IndexStorage.load().then(IndexStorage._monitor);
            }
        })
    }
}

export class Index {
    // [Singleton]
    private constructor() {
        browser.runtime.onStartup.addListener(() => {
            storage.defineItem(indexStorageKey, {
                fallback: {
                    records: [],
                    updateTime: new Date().getTime(),
                } as IndexData,
            });
        });
        browser.runtime.onInstalled.addListener(IndexStorage.load);
        IndexStorage.syncStorageData();
    }
    private static _index = new Index();
    public static get instance(): Index {
        return Index._index;
    } // [/]
    private has(id: string): boolean {
        return Object.hasOwn(data, id);
    }
    public insert(tag: Tag): boolean {
        if (this.has(tag.name)) {
            return false;
        }
        data[tag.name] = tag;
        IndexStorage.dump();
        return true;
    }
    public delete(id: string): void {
        if (!this.has(id)) {
            return;
        }
        delete data[id];
        IndexStorage.dump();
    }
    public search(keyword: string): Set<Tag> {
        const result = new Set<Tag>();
        if (!data) {
            return result;
        }
        keyword = keyword.trim().toLowerCase();
        for (const tag of Object.values(data)) {
            if (!keyword || tag.name.toLowerCase().includes(keyword)) {
                result.add(tag);
            }
        }
        return result;
    }
}
