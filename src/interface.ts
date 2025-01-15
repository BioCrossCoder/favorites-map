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
    UpsertNode,
    DeleteNode,
    SearchNodes,
    UpsertTag,
    DeleteTag,
    SearchTags,
    Import,
}

type UpsertData = {
    [Action.UpsertNode]: NodeData,
    [Action.UpsertTag]: TagData,
}

type UpsertAction = Action.UpsertNode | Action.UpsertTag;

export type UpsertRequest<T extends UpsertAction> = {
    action: T,
    data: UpsertData[T],
}

export type DeleteAction = Action.DeleteNode | Action.DeleteTag

export type DeleteRequest<T extends DeleteAction> = {
    action: T,
    data: string,
}

export type SearchRequest = {
    action: Action.SearchNodes | Action.SearchTags,
    data: string,
}

export type ImportRequest = {
    action: Action.Import,
    data: {
        nodes: NodeData[],
        tags: TagData[],
    },
}

export type OperationMessage = UpsertRequest<UpsertAction> | DeleteRequest<DeleteAction> | SearchRequest | ImportRequest;

export function isOperationMessage(message: any): message is OperationMessage {
    return Object.hasOwn(message, 'action') && Object.hasOwn(message, 'data');
}

export type SearchResponse<T extends NodeData | TagData> = {
    result: T[],
}

export type UpdateResponse = {
    success: boolean;
}

const storageKeyPrefix = 'local:favorites_map';

export const graphStorageKey: `local:${string}` = `${storageKeyPrefix}:graph`;

export const indexStorageKey: `local:${string}` = `${storageKeyPrefix}:index`;