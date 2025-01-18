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
const nameToID = {} as Record<string, string>;
function addTag(tag: Tag): void {
    data[tag.id] = tag;
    nameToID[tag.name] = tag.id;
}

function deleteTag(id: string): void {
    delete nameToID[data[id].name];
    delete data[id];
}

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
            addTag(new Tag(tag.id, tag.name, new Set(tag.labeledNodes)));
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
        return (nameToID[name] ?? id) !== id;
    }
    public upsert(tag: Tag): boolean {
        if (this.isNameRepeat(tag.id, tag.name)) {
            return false;
        }
        addTag(tag);
        IndexStorage.dump();
        return true;
    }
    public delete(id: string): void {
        deleteTag(id);
        IndexStorage.dump();
    }
    public search(keyword: string): Set<Tag> {
        return search(data, keyword);
    }
    public import(tags: Tag[]): void {
        for (const tag of tags) {
            if (!tag.name) {
                continue;
            }
            const tagID = nameToID[tag.name] ?? tag.id;
            const currentTag = data[tagID] ?? new Tag(tag.id, tag.name, new Set());
            tag.labeledNodes = tag.labeledNodes.union(currentTag.labeledNodes);
            tag.id = tagID;
            addTag(tag);
        }
        IndexStorage.dump();
    }
}
