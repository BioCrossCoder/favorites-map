export interface NodeData {
    name: string;
    url: string;
    relatedNodes: string[];
}

export const enum Action {
    Upsert,
    Delete,
    Search,
    Select,
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

export type SelectMessage = {
    action: Action.Select,
    data: string;
}

export type OperationMessage = UpsertMessage | DeleteMessage | SearchMessage | SelectMessage;

export type SearchResultMessage = {
    result: NodeData[];
}

export const storageKey: `local:${string}` = 'local:favorites_map';