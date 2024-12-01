export class Node {
    public name: string;
    public relatedNodeNames: Set<string>;
    public constructor(name: string, relatedNodes: Set<string>) {
        this.name = name;
        this.relatedNodeNames = relatedNodes;
    }
};

export class IndexNode extends Node { }

export class DataNode extends Node {
    public url: string;
    public constructor(name: string, url: string, relatedNodes: Set<string>) {
        super(name, relatedNodes);
        this.url = url;
    }
}

export const enum Action {
    Upsert,
    Delete,
    Search,
}

export type UpsertMessage = {
    action: Action.Upsert;
    data: Node;
}

export type DeleteMessage = {
    action: Action.Delete;
    data: string;
}

export type SearchMessage = {
    action: Action.Search;
    data: string;
}

export type OperationMessage = UpsertMessage | DeleteMessage | SearchMessage;

export type SearchResultMessage = {
    result: Set<Node>;
}