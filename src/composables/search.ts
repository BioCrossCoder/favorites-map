import { OperationMessage, Action, SearchResultMessage, NodeData } from '@/interface';
export function search(keyword: string, receiver: Ref<Array<NodeData>>) {
    const message: OperationMessage = {
        action: Action.Search,
        data: keyword,
    };
    browser.runtime.sendMessage(message).then((response: SearchResultMessage) => {
        receiver.value = response.result;
    });
}