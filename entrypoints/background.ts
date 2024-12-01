import { Node, IndexNode, DataNode, Action, OperationMessage, SearchResultMessage } from "./interface";

type GraphData = {
  dataNodes: Map<string, Node>;
  nodes: Map<string, Node>;
};

class Graph {
  // [Singleton]
  private constructor() {
    storage.watch(Graph._storageKey, this.load);
  }
  private static _graph = new Graph();
  public static get instance(): Graph {
    return Graph._graph;
  } // [/]
  // [DataStorage]
  private static _storageKey: `local:${string}` = 'local:favorites_map';
  private _data = {} as GraphData;
  public async load(): Promise<void> {
    this._data = await storage.getMeta<GraphData>(Graph._storageKey);
  }
  public async dump(): Promise<void> {
    await storage.setMeta(Graph._storageKey, this._data);
  } // [/]
  private updateRelations(oldNode: Node, newNode: Node): void {
    // [CheckID]
    if (oldNode.name !== newNode.name) {
      return
    } // [/]
    // [RemoveInvalidRelations]
    for (const name of oldNode.relatedNodeNames.difference(newNode.relatedNodeNames)) {
      const relatedNode: Node | undefined = this._data.nodes.get(name);
      if (relatedNode) {
        relatedNode.relatedNodeNames.delete(oldNode.name);
      }
    } // [/]
    // [AddNewRelations]
    for (const name of newNode.relatedNodeNames.difference(oldNode.relatedNodeNames)) {
      const relatedNode: Node | undefined = this._data.nodes.get(name);
      if (relatedNode) {
        relatedNode.relatedNodeNames.add(newNode.name);
      }
    } // [/]
  }
  public upsert(node: Node): void {
    const currentNode: Node | undefined = this._data.nodes.get(node.name);
    if (currentNode) {
      this.updateRelations(currentNode, node);
    }
    this._data.nodes.set(node.name, node);
    if (node instanceof DataNode) {
      this._data.dataNodes.set(node.url, node);
    }
    this.dump();
  }
  public delete(name: string): void {
    const node: Node | undefined = this._data.nodes.get(name);
    if (!node) {
      return
    }
    this.updateRelations(node, new Node(node.name, new Set<string>()));
    this._data.nodes.delete(node.name);
    if (node instanceof DataNode) {
      this._data.dataNodes.delete(node.url);
    }
    this.dump();
  }
  public search(keyword: string): Set<Node> {
    const result = new Set<Node>();
    if (!this._data) {
      return result;
    }
    const indexNodes = new Set<IndexNode>();
    // [SearchByName]
    for (const [name, node] of this._data.nodes) {
      if (!keyword || name.includes(keyword)) {
        if (node instanceof DataNode) {
          result.add(node);
        } else {
          indexNodes.add(node);
        }
      }
    } // [/]
    // [SearchByURL]
    for (const [url, node] of this._data.dataNodes) {
      if (!keyword || url.toLowerCase().includes(keyword.toLowerCase())) {
        result.add(node);
      }
    } // [/]
    return result.union(indexNodes);
  }
}

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(Graph.instance.load);
  browser.runtime.onMessage.addListener((message: OperationMessage, _sender, sendResponse: (response: SearchResultMessage) => void) => {
    switch (message.action) {
      case Action.Upsert:
        Graph.instance.upsert(message.data);
        break;
      case Action.Delete:
        Graph.instance.delete(message.data);
        break;
      case Action.Search:
        const result: Set<Node> = Graph.instance.search(message.data);
        sendResponse({ result })
        break;
    }
  })
});
