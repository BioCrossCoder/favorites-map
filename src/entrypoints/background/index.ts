import { Action, isOperationMessage, NodeData, OperationMessage, SearchResponse, TagData, UpdateResponse, UpsertRequest } from "@/interface";
import { Graph, Node } from "./graph";
import { Index, Tag } from "./guide";

function buildSearchNodesResponse(data: Array<Node | null>): NodeData[] {
    return data.filter(node => node !== null).map((node: Node) => ({
        name: node.name,
        url: node.url,
        relatedNodes: Array.from(node.relatedNodeURLs),
    }));
}

function buildSearchTagsResponse(data: Array<Tag | null>): TagData[] {
    return data.filter(tag => tag !== null).map((tag: Tag) => ({
        id: tag.id,
        name: tag.name,
        labeledNodes: Array.from(tag.labeledNodes),
    }));
}

function keepAlive(): void {
    setInterval(() => {
        browser.runtime.sendMessage('').catch(() => { });
    }, 1000 * 10);
}

export default defineBackground(() => {
    keepAlive();
    browser.runtime.onMessage.addListener((message: OperationMessage, _sender, sendResponse: (response: SearchResponse<NodeData | TagData> | UpdateResponse) => void) => {
        if (!isOperationMessage(message)) {
            return;
        }
        switch (message.action) {
            case Action.UpsertNode:
                {
                    const msg = message as UpsertRequest<Action.UpsertNode>;
                    const node = new Node(msg.data.name, msg.data.url, new Set(msg.data.relatedNodes));
                    Graph.instance.upsert(node);
                }
                break;
            case Action.DeleteNode:
                {
                    Graph.instance.delete(message.data);
                }
                break;
            case Action.SearchNodes:
                {
                    const nodes: Set<Node> = Graph.instance.search(message.data);
                    const result: NodeData[] = buildSearchNodesResponse(Array.from(nodes));
                    sendResponse({ result });
                }
                break;
            case Action.Import:
                {
                    const nodes: Node[] = message.data.nodes.map((nodeData: NodeData) => {
                        return new Node(nodeData.name, nodeData.url, new Set(nodeData.relatedNodes));
                    });
                    Graph.instance.import(nodes);
                    const tags: Tag[] = message.data.tags.map((tagData: TagData) => {
                        return new Tag(tagData.id, tagData.name, new Set(tagData.labeledNodes));
                    });
                    Index.instance.import(tags);
                }
                break;
            case Action.UpsertTag:
                {
                    const msg = message as UpsertRequest<Action.UpsertTag>;
                    const tag = new Tag(msg.data.id, msg.data.name, new Set(msg.data.labeledNodes));
                    const success = Index.instance.upsert(tag);
                    sendResponse({ success });
                }
                break;
            case Action.DeleteTag:
                {
                    Index.instance.delete(message.data);
                }
                break;
            case Action.SearchTags:
                {
                    const tags: Set<Tag> = Index.instance.search(message.data);
                    const result: TagData[] = buildSearchTagsResponse(Array.from(tags));
                    sendResponse({ result });
                }
                break;
        }
    });
});