import { Action, isOperationMessage, NodeData, OperationMessage, SearchResultMessage, storageKey } from "@/interface";

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

let data = {} as Record<string, Node>;

class GraphStorage {
    public static async load(): Promise<void> {
        const dataToLoad: GraphData | null = await storage.getItem(storageKey);
        if (!dataToLoad) {
            return
        }
        const relatedNodes = new Map<string, string[]>();
        dataToLoad.edges.forEach(([id1, id2]) => {
            if (!relatedNodes.has(id1)) {
                relatedNodes.set(id1, []);
            }
            relatedNodes.get(id1)!.push(id2);
            if (!relatedNodes.has(id2)) {
                relatedNodes.set(id2, []);
            }
            relatedNodes.get(id2)!.push(id1);
        })
        dataToLoad.nodes.forEach(node => {
            data[node.id] = new Node(node.name, node.id, new Set(relatedNodes.get(node.id)));
        });
    }
    public static async dump(): Promise<void> {
        const nodesData = new Array<NodeMetaData>();
        const edgesData = new Set<string>();
        Object.values(data).forEach((node: Node) => {
            nodesData.push({
                id: node.url,
                name: node.name
            });
            Array.from(node.relatedNodeURLs).forEach((url: string) => {
                edgesData.add(JSON.stringify([node.url, url].sort()))
            });
        });
        const dataToDump = {
            nodes: nodesData,
            edges: Array.from(edgesData).map((json: string) => {
                return JSON.parse(json) as [string, string];
            })
        } as GraphData;
        await storage.setItem(storageKey, dataToDump);
    }
    private static _monitor() {
        storage.watch(storageKey, GraphStorage.load);
    }
    public static syncStorageData() {
        storage.getItem(storageKey).then(value => {
            if (!value) {
                GraphStorage.dump().then(GraphStorage._monitor);
            } else {
                GraphStorage.load().then(GraphStorage._monitor);
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
    public select(url: string): Node | null {
        return data[url] || null;
    }
    public import(nodes: Node[]) {
        for (const node of nodes) {
            const currentNode: Node = data[node.url] || new Node(node.name, node.url, new Set());
            this.updateRelations(currentNode, node);
            data[node.url] = node;
        }
        GraphStorage.dump();
    }
}

function buildResponse(data: Array<Node | null>): NodeData[] {
    return data.filter(node => node !== null).map(node => ({
        name: node.name,
        url: node.url,
        relatedNodes: Array.from(node.relatedNodeURLs)
    }));
}

type NodeMetaData = {
    id: string,
    name: string,
}

type GraphData = {
    nodes: NodeMetaData[],
    edges: [string, string][]
}

function keepAlive() {
    setInterval(() => {
        browser.runtime.sendMessage('')
    }, 1000);
}

export default defineBackground(() => {
    browser.runtime.onStartup.addListener(() => {
        storage.defineItem(storageKey, {
            fallback: {
                nodes: [],
                edges: [],
            } as GraphData,
        });
    });
    browser.runtime.onInstalled.addListener(GraphStorage.load);
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
            case Action.Select:
                {
                    const node: Node | null = Graph.instance.select(message.data);
                    const result: NodeData[] = buildResponse([node]);
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
    keepAlive();
});