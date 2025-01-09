import { Action, DeleteAction, DeleteRequest, NodeData, TagData, UpdateResponse, UpsertRequest } from "@/interface";
import * as vNG from 'v-network-graph';
import { useSelectedNodesStore, useFavoritesMapStore, useSelectedTagsStore } from "./store";
import { FavoritesMapStore, SelectedNodesStore } from "./interface";
import { storeToRefs } from "pinia";

export function upsertNode(name: string, url: string): void {
    const store = useFavoritesMapStore();
    const selectedNodes = useSelectedNodesStore();
    const selectedTags = useSelectedTagsStore().getState();
    url = decodeURIComponent(url);
    const message: UpsertRequest<Action.UpsertNode> = {
        action: Action.UpsertNode,
        data: {
            name,
            url,
            relatedNodes: Array.from(selectedNodes.value.filter((value: string) => value !== url))
        }
    }
    browser.runtime.sendMessage(message).then(() => {
        const oldTags = new Set(store.getTags(url).value.map((tag: TagData) => tag.id));
        const newTags = new Set(selectedTags.value);
        const tagsToUpdate = new Array<TagData>();
        Array.from(oldTags.difference(newTags)).forEach((tag: string) => {
            const data: TagData = store.selectTag(tag);
            data.labeledNodes = data.labeledNodes.filter((node: string) => node !== url);
            tagsToUpdate.push(data);
        });
        Array.from(newTags.difference(oldTags)).forEach((tag: string) => {
            const data: TagData = store.selectTag(tag);
            data.labeledNodes.push(url);
            tagsToUpdate.push(data);
        });
        const tasks = new Array<Promise<any>>();
        tagsToUpdate.forEach((data: TagData) => {
            const message: UpsertRequest<Action.UpsertTag> = {
                action: Action.UpsertTag,
                data,
            }
            tasks.push(browser.runtime.sendMessage(message));
        });
        Promise.all(tasks).then(window.close);
    });
}

export function deleteItem(id: string, action: DeleteAction, stay?: boolean): void {
    const message: DeleteRequest<typeof action> = {
        action,
        data: id,
    };
    const store = useFavoritesMapStore();
    const tasks = new Array<Promise<any>>();
    if (action === Action.DeleteNode) {
        Array.from(store.getTags(id).value).forEach((data: TagData) => {
            data.labeledNodes = data.labeledNodes.filter((node: string) => node !== id);
            const message: UpsertRequest<Action.UpsertTag> = {
                action: Action.UpsertTag,
                data,
            }
            tasks.push(browser.runtime.sendMessage(message));
        })
    }
    Promise.all(tasks).then(() => {
        browser.runtime.sendMessage(message).then(() => {
            if (!stay) {
                window.close();
            }
        });
    });
}

export async function upsertTag(id: string, name: string, labeledNodes?: string[]): Promise<boolean> {
    const store = useFavoritesMapStore();
    const message: UpsertRequest<Action.UpsertTag> = {
        action: Action.UpsertTag,
        data: {
            id,
            name,
            labeledNodes: labeledNodes ?? store.selectTag(id).labeledNodes,
        }
    }
    return (await browser.runtime.sendMessage(message) as UpdateResponse).success;
}

export function handleMouseEnter(message: string, state: Ref<string>): void {
    state.value = message;
}

export function handleMouseLeave(state: Ref<string>): void {
    state.value = '';
}

export function buildGraphNodes(data: Ref<NodeData[]>, activator?: (node: string) => boolean): Ref<Record<string, vNG.Node>> {
    return computed<Record<string, vNG.Node>>(() => {
        const nodeMap = {} as Record<string, vNG.Node>;
        for (const node of data.value) {
            nodeMap[node.url] = {
                name: node.name,
                active: activator ? activator(node.name) : false,
            };
        }
        return nodeMap;
    })
}

export function buildGraphEdges(data: Ref<NodeData[]>): Ref<Record<string, vNG.Edge>> {
    return computed<Record<string, vNG.Edge>>(() => {
        const edgeMap = {} as Record<string, vNG.Edge>;
        let count: number = 0;
        for (const node of data.value) {
            for (const neighbor of node.relatedNodes) {
                edgeMap[String(++count)] = {
                    source: node.url,
                    target: neighbor,
                };
            }
        }
        return edgeMap;
    })
}

function buildSelectGraphEventHandlers(hover: Ref<string>): vNG.EventHandlers {
    const selectedNodes = useSelectedNodesStore();
    const store = useFavoritesMapStore();
    return {
        'node:click': ({ node }) => {
            if (selectedNodes.has(node)) {
                selectedNodes.remove(node);
            } else {
                selectedNodes.add(node);
            }
        },
        'node:pointerover': ({ node }) => {
            hover.value = store.selectNode(node)!.name;
        },
        'node:pointerout': () => {
            hover.value = '';
        },
        'view:click': () => {
            selectedNodes.clear();
        }
    }
}

export function buildSelectedNodesStates(): {
    selectedNodes: SelectedNodesStore,
    selectedNodesOld: Ref<string[]>,
    handleClickReset: () => void,
} {
    const selectedNodes = useSelectedNodesStore();
    const selectedNodesOld = ref(new Array<string>());
    function handleClickReset() {
        selectedNodes.clear();
        selectedNodesOld.value.forEach(selectedNodes.add);
    }
    return {
        selectedNodes,
        selectedNodesOld,
        handleClickReset,
    }
}

export function buildSelectGraph(data: Ref<NodeData[]>): {
    nodes: Ref<Record<string, vNG.Node>>,
    edges: Ref<Record<string, vNG.Edge>>,
    hoverNode: Ref<string>,
    eventHandlers: vNG.EventHandlers,
} {
    const store = useSelectedNodesStore();
    const nodes = buildGraphNodes(data, store.has);
    const edges = buildGraphEdges(data);
    const hoverNode = ref('');
    const eventHandlers = buildSelectGraphEventHandlers(hoverNode);
    return {
        nodes,
        edges,
        hoverNode,
        eventHandlers,
    }
}

export function buildTextState(): {
    text: Ref<string>,
    isNotEmpty: ComputedRef<boolean>,
} {
    const text = ref('');
    const isNotEmpty = computed<boolean>(() => text.value !== '');
    return {
        text,
        isNotEmpty,
    }
}

export function buildSearchStates(): {
    keyword: Ref<string>,
    store: FavoritesMapStore,
    nodeData: Ref<NodeData[]>,
    tagData: Ref<TagData[]>,
} {
    const keyword = ref('');
    const store = useFavoritesMapStore();
    const nodeData = store.searchNodes(keyword);
    const tagData = store.searchTags(keyword);
    return {
        keyword,
        store,
        nodeData,
        tagData,
    }
}

export function textMatch<T extends { name: string }>(data: T[], keyword: string): T[] {
    return data.filter((item: T) => !keyword || item.name.toLowerCase().includes(keyword));
}

export function search<T extends { name: string }>(data: Record<string, T>, keyword: string): Set<T> {
    if (!data) {
        return new Set<T>();
    }
    keyword = keyword.trim().toLowerCase();
    return new Set(textMatch(Object.values(data), keyword));
}