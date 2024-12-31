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
    const monitor = () => search('', data);
    monitor();
    storage.watch(storageKey, monitor); // [/]
    // [SearchNodesByKeyword]
    function searchProxy(keyword: Ref<string>): ComputedRef<NodeData[]> {
        return computed(() => {
            return data.value.filter((node: NodeData) => !keyword.value || node.name.toLowerCase().includes(keyword.value));
        });
    } // [/]
    // [FindNodeByID]
    const nodes = computed(() => {
        const collections = {} as Record<string, NodeData>;
        for (const node of data.value) {
            collections[node.url] = node;
        }
        return collections;
    });
    function find(id: string): NodeData {
        return nodes.value[id];
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