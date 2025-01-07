import { search } from "@/composables/utils";
import { TagData, indexStorageKey } from "@/interface";

export class Tag {
    public id: string;
    public name: string;
    public labeledNodes: Set<string>;
    public constructor(id: string, name: string, labeledNodes: Set<string>) {
        this.id = id;
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
            data[tag.id] = new Tag(tag.id, tag.name, new Set(tag.labeledNodes));
        });
        IndexStorage.updateTime = new Date(dataToLoad?.updateTime ?? new Date());
    }
    public static async dump(): Promise<void> {
        const dataToDump: IndexData = {
            records: Object.values(data).map((tag: Tag) => ({
                id: tag.id,
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
    private isNameRepeat(id: string, name: string): boolean {
        return Object.values(data).some((tag: Tag) => tag.id !== id && tag.name === name);
    }
    public upsert(tag: Tag): boolean {
        if (this.isNameRepeat(tag.id, tag.name)) {
            return false;
        }
        data[tag.id] = tag;
        IndexStorage.dump();
        return true;
    }
    public delete(id: string): void {
        delete data[id];
        IndexStorage.dump();
    }
    public search(keyword: string): Set<Tag> {
        return search(data, keyword);
    }
}
