import { NodeData, graphStorageKey, Action, SearchResponse, SearchRequest, TagData, indexStorageKey } from '@/interface';
import { defineStore } from 'pinia';
import { FavoritesMapStore, GraphPositionStore, SelectedNodesStore, SelectedTagsStore, StoreBuilder } from './interface';

function loadNodes(keyword: string, receiver: Ref<NodeData[]>): void {
    const message: SearchRequest = {
        action: Action.SearchNodes,
        data: keyword,
    };
    browser.runtime.sendMessage(message).then((response: SearchResponse<NodeData>) => {
        receiver.value = response.result;
    });
}

function loadTags(keyword: string, receiver: Ref<TagData[]>): void {
    const message: SearchRequest = {
        action: Action.SearchTags,
        data: keyword,
    }
    browser.runtime.sendMessage(message).then((response: SearchResponse<TagData>) => {
        receiver.value = response.result;
    })
}

export const useFavoritesMapStore: StoreBuilder<FavoritesMapStore> = defineStore('favorites-map', () => {
    // [LoadData]
    const nodeList = ref(new Array<NodeData>());
    const tagList = ref(new Array<TagData>());
    const loadData = () => {
        loadNodes('', nodeList);
        loadTags('', tagList);
    };
    loadData();
    storage.watch(graphStorageKey, loadData);
    storage.watch(indexStorageKey, loadData) // [/]
    function searchNodes(keyword: Ref<string>): ComputedRef<NodeData[]> {
        return computed(() => textMatch(nodeList.value, keyword.value));
    }
    // [FindNodeByID]
    const nodeSet = computed(() => {
        const collections = {} as Record<string, NodeData>;
        for (const node of nodeList.value) {
            collections[node.url] = node;
        }
        return collections;
    });
    function selectNode(id: string): NodeData | null {
        return nodeSet.value[id] ?? null;
    } // [/]
    function searchTags(keyword: Ref<string>): ComputedRef<TagData[]> {
        return computed(() => textMatch(tagList.value, keyword.value));
    }
    // [FindTagByID]
    const tagSet = computed(() => {
        const collections = {} as Record<string, TagData>;
        for (const tag of tagList.value) {
            collections[tag.id] = tag;
        }
        return collections;
    });
    function selectTag(id: string): TagData {
        return tagSet.value[id];
    } // [/]
    function filterNodes(tags: Ref<string[]>): ComputedRef<NodeData[]> {
        return computed(() => {
            const tagSet = new Set(tags.value);
            return nodeList.value.filter((node: NodeData) => tagMap.value[node.url].isSupersetOf(tagSet));
        });
    }
    // [GetTagsOfNode]
    const tagMap = computed(() => {
        const data = {} as Record<string, Set<TagData>>;
        for (const node of nodeList.value) {
            data[node.url] = new Set<TagData>();
        }
        for (const tag of tagList.value) {
            tag.labeledNodes.forEach((node: string) => {
                data[node].add(tag);
            });
        }
        return data;
    });
    function getTags(node: string): TagData[] {
        return Array.from(tagMap.value[node]) ?? [];
    } // [/]
    // [ExportAPI]
    return {
        searchNodes,
        selectNode,
        searchTags,
        selectTag,
        filterNodes,
        getTags,
    } // [/]
});

export const useSelectedTagsStore: StoreBuilder<SelectedTagsStore> = defineStore('selected-tags', () => {
    const data = ref(new Array<string>());
    return {
        getState: () => data,
    };
})

export const useGraphPositionStore: StoreBuilder<GraphPositionStore> = defineStore('graph-position', () => {
    const value = ref('');
    function set(newValue: string) {
        value.value = newValue;
    }
    return {
        value: readonly(value),
        set
    };
});

export const useSelectedNodesStore: StoreBuilder<SelectedNodesStore> = defineStore('selected-nodes', () => {
    const data = ref(new Set<string>());
    const value = computed(() => Array.from(data.value));
    function add(node: string) {
        data.value.add(node);
    }
    function remove(node: string) {
        data.value.delete(node);
    }
    function has(node: string): boolean {
        return data.value.has(node);
    }
    const init = ref(false);
    function load(nodes: string[]) {
        if (!init.value) {
            nodes.map(add);
            init.value = true;
        }
    }
    function clear() {
        data.value.clear();
    }
    return {
        value: readonly(value),
        add,
        remove,
        has,
        load,
        clear
    }
});
