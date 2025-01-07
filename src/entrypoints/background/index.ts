import { Action, isOperationMessage, NodeData, OperationMessage, SearchResultMessage } from "@/interface";
import { Graph, Node } from "./graph";

function buildResponse(data: Array<Node | null>): NodeData[] {
    return data.filter(node => node !== null).map(node => ({
        name: node.name,
        url: node.url,
        relatedNodes: Array.from(node.relatedNodeURLs)
    }));
}

function keepAlive(): void {
    setInterval(() => {
        browser.runtime.sendMessage('').catch(() => { });
    }, 1000 * 10);
}

export default defineBackground(() => {
    keepAlive();
    browser.runtime.onMessage.addListener((message: OperationMessage, _sender, sendResponse: (response: SearchResultMessage) => void) => {
        if (!isOperationMessage(message)) {
            return;
        }
        switch (message.action) {
            case Action.Upsert:
                {
                    const node = new Node(message.data.name, message.data.url, new Set(message.data.relatedNodes));
                    Graph.instance.upsert(node);
                }
                break;
            case Action.Delete:
                {
                    Graph.instance.delete(message.data);
                }
                break;
            case Action.Search:
                {
                    const nodes: Set<Node> = Graph.instance.search(message.data);
                    const result: NodeData[] = buildResponse(Array.from(nodes));
                    sendResponse({ result });
                }
                break;
            case Action.Import:
                {
                    const nodes: Node[] = message.data.map((nodeData: NodeData) => {
                        return new Node(nodeData.name, nodeData.url, new Set(nodeData.relatedNodes));
                    });
                    Graph.instance.import(nodes);
                }
                break;
        }
    });
});