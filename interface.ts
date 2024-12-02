export interface NodeData {
    name: string;
    relatedNodeNames: string[];
}

export const enum Action {
    Upsert,
    Delete,
    Search,
}

export type UpsertMessage = {
    action: Action.Upsert;
    data: NodeData;
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
    result: NodeData[];
}
