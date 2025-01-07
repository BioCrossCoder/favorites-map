import { NodeData } from "@/interface";

export type FavoritesMapStore = {
    search: (keyword: Ref<string>) => ComputedRef<NodeData[]>,
    find: (id: string) => NodeData | null,
};

export type GraphPositionStore = {
    value: Readonly<string>,
    set: (newValue: string) => void,
}

export type SelectedNodesStore = {
    value: Readonly<string[]>,
    add: (node: string) => void,
    remove: (node: string) => void,
    has: (node: string) => boolean,
    load: (nodes: string[]) => void,
    clear: () => void,
}

export type StoreBuilder<T extends FavoritesMapStore | GraphPositionStore | SelectedNodesStore> = () => T;
