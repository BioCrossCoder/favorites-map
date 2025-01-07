import { search } from "@/composables/utils";
import { graphStorageKey } from "@/interface";

export class Node {
    public url: string;
    public name: string;
    public relatedNodeURLs: Set<string>;
    public constructor(name: string, url: string, relatedNodes: Set<string>) {
        this.name = name;
        this.relatedNodeURLs = relatedNodes;
        this.url = url;
    }
}

const data = {} as Record<string, Node>;

type NodeMetaData = {
    id: string,
    name: string,
}

type GraphData = {
    nodes: NodeMetaData[],
    edges: [string, string][],
    updateTime: number,
}

class GraphStorage {
    private static updateTime: Date = new Date();
    public static async load(): Promise<void> {
        const dataToLoad: GraphData | null = await storage.getItem(graphStorageKey);
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
        GraphStorage.updateTime = new Date(dataToLoad?.updateTime ?? new Date());
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
        const dataToDump: GraphData = {
            nodes: nodesData,
            edges: Array.from(edgesData).map((json: string) => {
                return JSON.parse(json) as [string, string];
            }),
            updateTime: GraphStorage.updateTime.getTime(),
        };
        await storage.setItem(graphStorageKey, dataToDump);
    }
    private static _monitor(): void {
        storage.watch(graphStorageKey, GraphStorage.load);
    }
    public static syncStorageData(): void {
        storage.getItem(graphStorageKey).then(value => {
            if (!value) {
                GraphStorage.dump().then(GraphStorage._monitor);
            } else {
                GraphStorage.load().then(GraphStorage._monitor);
            }
        })
    }
};

export class Graph {
    // [Singleton]
    private constructor() {
        browser.runtime.onStartup.addListener(() => {
            storage.defineItem(graphStorageKey, {
                fallback: {
                    nodes: [],
                    edges: [],
                    updateTime: new Date().getTime(),
                } as GraphData,
            });
        });
        browser.runtime.onInstalled.addListener(GraphStorage.load);
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
        return search(data, keyword);
    }
    public import(nodes: Node[]): void {
        for (const node of nodes) {
            const currentNode: Node = data[node.url] || new Node(node.name, node.url, new Set());
            this.updateRelations(currentNode, node);
            data[node.url] = node;
        }
        GraphStorage.dump();
    }
}
