import { Action, NodeData, OperationMessage, SearchResultMessage } from "@/interface";

class Node {
  public name: string;
  public relatedNodeNames: Set<string>;
  public constructor(name: string, relatedNodes: Set<string>) {
    this.name = name;
    this.relatedNodeNames = relatedNodes;
  }
};

class IndexNode extends Node { }

class DataNode extends Node {
  public url: string;
  public constructor(name: string, url: string, relatedNodes: Set<string>) {
    super(name, relatedNodes);
    this.url = url;
  }
}

type GraphData = {
  dataNodes: Record<string, DataNode>;
  nodes: Record<string, Node>;
};
const storageKey: `local:${string}` = 'local:favorites_map';
let data: GraphData = {
  dataNodes: {},
  nodes: {},
}

class GraphStorage {
  public static async load(): Promise<void> {
    data = await storage.getMeta<GraphData>(storageKey);
  }
  public static async dump(): Promise<void> {
    await storage.setMeta(storageKey, data);
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
    for (const name of oldNode.relatedNodeNames.difference(newNode.relatedNodeNames)) {
      const relatedNode: Node | undefined = data.nodes[name];
      if (relatedNode) {
        relatedNode.relatedNodeNames.delete(oldNode.name);
      }
    } // [/]
    // [AddNewRelations]
    for (const name of newNode.relatedNodeNames.difference(oldNode.relatedNodeNames)) {
      const relatedNode: Node | undefined = data.nodes[name];
      if (relatedNode) {
        relatedNode.relatedNodeNames.add(newNode.name);
      }
    } // [/]
  }
  public upsert(node: Node): void {
    const currentNode: Node | undefined = data.nodes[node.name];
    if (currentNode) {
      this.updateRelations(currentNode, node);
    }
    data.nodes[node.name] = node;
    if (node instanceof DataNode) {
      data.dataNodes[node.url] = node;
    }
    GraphStorage.dump();
  }
  public delete(name: string): void {
    const node: Node | undefined = data.nodes[name];
    if (!node) {
      return
    }
    this.updateRelations(node, new Node(node.name, new Set<string>()));
    delete data.nodes[node.name];
    if (node instanceof DataNode) {
      delete data.dataNodes[node.url];
    }
    GraphStorage.dump();
  }
  public search(keyword: string): Set<Node> {
    const result = new Set<Node>();
    if (!data) {
      return result;
    }
    const indexNodes = new Set<IndexNode>();
    // [SearchByName]
    for (const [name, node] of Object.entries(data.nodes)) {
      if (!keyword || name.includes(keyword)) {
        if (node instanceof DataNode) {
          result.add(node);
        } else {
          indexNodes.add(node);
        }
      }
    } // [/]
    // [SearchByURL]
    for (const [url, node] of Object.entries(data.dataNodes)) {
      if (!keyword || url.toLowerCase().includes(keyword.toLowerCase())) {
        result.add(node);
      }
    } // [/]
    return result.union(indexNodes);
  }
}

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(GraphStorage.load);
  browser.runtime.onMessage.addListener((message: OperationMessage, _sender, sendResponse: (response: SearchResultMessage) => void) => {
    switch (message.action) {
      case Action.Upsert:
        const node = new Node(message.data.name, new Set(message.data.relatedNodeNames));
        Graph.instance.upsert(node);
        break;
      case Action.Delete:
        Graph.instance.delete(message.data);
        break;
      case Action.Search:
        const nodes: Set<Node> = Graph.instance.search(message.data);
        const result: NodeData[] = Array.from(nodes).map(node => ({
          name: node.name,
          relatedNodeNames: Array.from(node.relatedNodeNames)
        }));
        sendResponse({ result });
        break;
    }
  })
});
