import { OperationMessage, Action, SearchResultMessage, NodeData } from '@/interface';
export async function search(keyword: string): Promise<SearchResultMessage> {
    const message: OperationMessage = {
        action: Action.Search,
        data: keyword,
    };
    return await browser.runtime.sendMessage(message) || { result: [] };
}