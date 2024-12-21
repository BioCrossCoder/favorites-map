import { Action, NodeData, OperationMessage, SearchResultMessage } from "@/interface";

class Node {
    public url: string;
    public name: string;
    public relatedNodeURLs: Set<string>;
    public constructor(name: string, url: string, relatedNodes: Set<string>) {
        this.name = name;
        this.relatedNodeURLs = relatedNodes;
        this.url = url;
    }
}

type GraphData = Record<string, Node>;
const storageKey: `local:${string}` = 'local:favorites_map';
let data: GraphData = {};

class GraphStorage {
    public static async load(): Promise<void> {
        let localData = await storage.getItem(storageKey);
        if (!localData) {
            localData = new Array<NodeData>();
            storage.setItem(storageKey, localData);
        }
        (localData as NodeData[]).forEach(node => {
            data[node.url] = new Node(node.name, node.url, new Set(node.relatedNodes));
        });
    }
    public static async dump(): Promise<void> {
        await storage.setItem(storageKey, Object.values(data).map(node => ({
            name: node.name,
            url: node.url,
            relatedNodeURLs: node.relatedNodeURLs,
        })));
    }
    private static _monitor() {
        storage.watch(storageKey, GraphStorage.load);
    }
    public static syncStorageData() {
        storage.getItem(storageKey).then((value) => {
            if (!value) {
                GraphStorage.dump().then(GraphStorage._monitor);
            } else {
                GraphStorage._monitor();
            }
        })
    }
};

class Graph {
    // [Singleton]
    private constructor() {
        GraphStorage.syncStorageData();
    }
    private static _graph = new Graph();
    public static get instance(): Graph {
        return Graph._graph;
    } // [/]
    private updateRelations(oldNode: Node, newNode: Node): void {
        // [CheckID]
        if (oldNode.name !== newNode.name) {
            return
        } // [/]
        // [RemoveInvalidRelations]
        for (const url of oldNode.relatedNodeURLs.difference(newNode.relatedNodeURLs)) {
            const relatedNode: Node | undefined = data[url];
            if (relatedNode) {
                relatedNode.relatedNodeURLs.delete(oldNode.url);
            }
        } // [/]
        // [AddNewRelations]
        for (const url of newNode.relatedNodeURLs.difference(oldNode.relatedNodeURLs)) {
            const relatedNode: Node | undefined = data[url];
            if (relatedNode) {
                relatedNode.relatedNodeURLs.add(newNode.url);
            }
        } // [/]
    }
    public upsert(node: Node): void {
        const currentNode: Node = data[node.url] || new Node(node.name, node.url, new Set());
        this.updateRelations(currentNode, node);
        data[node.url] = node;
        GraphStorage.dump();
    }
    public delete(url: string): void {
        const node: Node | undefined = data[url];
        if (!node) {
            return
        }
        this.updateRelations(node, new Node(node.name, node.url, new Set<string>()));
        delete data[node.url];
        GraphStorage.dump();
    }
    public search(keyword: string): Set<Node> {
        const result = new Set<Node>();
        if (!data) {
            return result;
        }
        keyword = keyword.trim().toLowerCase();
        for (const node of Object.values(data)) {
            if (!keyword || node.name.toLowerCase().includes(keyword)) {
                result.add(node);
            }
        } // [/]
        return result;
    }
}

export default defineBackground(() => {
    browser.runtime.onInstalled.addListener(GraphStorage.load);
    browser.runtime.onMessage.addListener((message: OperationMessage, _sender, sendResponse: (response: SearchResultMessage) => void) => {
        switch (message.action) {
            case Action.Upsert:
                const node = new Node(message.data.name, message.data.url, new Set(message.data.relatedNodes));
                Graph.instance.upsert(node);
                break;
            case Action.Delete:
                Graph.instance.delete(message.data);
                break;
            case Action.Search:
                const nodes: Set<Node> = Graph.instance.search(message.data);
                const result: NodeData[] = Array.from(nodes).map(node => ({
                    name: node.name,
                    url: node.url,
                    relatedNodes: Array.from(node.relatedNodeURLs)
                }));
                sendResponse({ result });
                break;
        }
    })
});