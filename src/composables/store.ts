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
    const data = ref(new Array<NodeData>());
    const monitor = () => search('', data);
    monitor();
    storage.watch(storageKey, monitor);
    function searchProxy(keyword: Ref<string>): ComputedRef<NodeData[]> {
        return computed(() => {
            return data.value.filter((node: NodeData) => !keyword.value || node.name.toLowerCase().includes(keyword.value));
        });
    }
    return {
        search: searchProxy,
    }
});