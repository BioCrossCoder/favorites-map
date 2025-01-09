import { NodeData, TagData } from "@/interface";

export type FavoritesMapStore = {
    searchNodes: (keyword: Ref<string>) => ComputedRef<NodeData[]>,
    selectNode: (id: string) => NodeData | null,
    searchTags: (keyword: Ref<string>) => ComputedRef<TagData[]>,
    selectTag: (id: string) => TagData,
    filterNodes: (tags: Ref<string[]>) => ComputedRef<NodeData[]>,
    getTags: (node: string) => ComputedRef<TagData[]>,
};

export type GraphPositionStore = {
    value: Readonly<string>,
    set: (newValue: string) => void,
}

export type SelectedTagsStore = {
    getState: () => Ref<string[]>,
}

export type SelectedNodesStore = {
    value: Readonly<string[]>,
    add: (node: string) => void,
    remove: (node: string) => void,
    has: (node: string) => boolean,
    load: (nodes: string[]) => void,
    clear: () => void,
}

export type StoreBuilder<T extends FavoritesMapStore | GraphPositionStore | SelectedNodesStore | SelectedTagsStore> = () => T;
