import { NodeData, storageKey, OperationMessage, Action, SearchResultMessage } from '@/interface';
import { defineStore } from 'pinia';

function search(keyword: string, receiver: Ref<NodeData[]>) {
    const message: OperationMessage = {
        action: Action.Search,
        data: keyword,
    };
    browser.runtime.sendMessage(message).then((response: SearchResultMessage) => {
        receiver.value = response.result;
    });
}

export const useFavoritesMapStore = defineStore('favorites-map', () => {
    // [LoadData]
    const data = ref(new Array<NodeData>());
    const loadData = () => search('', data);
    loadData();
    storage.watch(storageKey, loadData); // [/]
    // [SearchNodesByKeyword]
    function searchProxy(keyword: Ref<string>): ComputedRef<NodeData[]> {
        return computed(() => data.value.filter((node: NodeData) => !keyword.value || node.name.toLowerCase().includes(keyword.value)));
    } // [/]
    // [FindNodeByID]
    const nodes = computed(() => {
        const collections = {} as Record<string, NodeData>;
        for (const node of data.value) {
            collections[node.url] = node;
        }
        return collections;
    });
    function find(id: string): NodeData | null {
        return nodes.value[id] || null;
    } // [/]
    // [ExportAPI]
    return {
        search: searchProxy,
        find,
    } // [/]
});

export const useGraphPositionStore = defineStore('graph-position', () => {
    const value = ref('');
    function set(newValue: string) {
        value.value = newValue;
    }
    return {
        value: readonly(value),
        set
    };
});

export const useSelectedNodesStore = defineStore('selected-nodes', () => {
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
