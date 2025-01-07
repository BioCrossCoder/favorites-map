export type NodeData = {
    name: string,
    url: string,
    relatedNodes: string[],
}

export type TagData = {
    id: string,
    name: string,
    labeledNodes: string[],
}

export const enum Action {
    Upsert,
    Delete,
    Search,
    Import,
}

export type UpsertMessage = {
    action: Action.Upsert,
    data: NodeData,
}

export type DeleteMessage = {
    action: Action.Delete,
    data: string,
}

export type SearchMessage = {
    action: Action.Search,
    data: string,
}

export type ImportMessage = {
    action: Action.Import,
    data: NodeData[],
}


export type OperationMessage = UpsertMessage | DeleteMessage | SearchMessage | ImportMessage;

export function isOperationMessage(message: any): message is OperationMessage {
    return Object.hasOwn(message, 'action') && Object.hasOwn(message, 'data');
}

export type SearchResultMessage = {
    result: NodeData[],
}

const storageKeyPrefix = 'local:favorites_map';

export const graphStorageKey: `local:${string}` = `${storageKeyPrefix}:graph`;

export const indexStorageKey: `local:${string}` = `${storageKeyPrefix}:index`;