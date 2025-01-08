import { Action, DeleteAction, DeleteRequest, NodeData, TagData, UpdateResponse, UpsertRequest } from "@/interface";
import * as vNG from 'v-network-graph';
import { useSelectedNodesStore, useFavoritesMapStore } from "./store";
import { FavoritesMapStore, SelectedNodesStore } from "./interface";

export function upsertNode(name: string, url: string): void {
    const store = useSelectedNodesStore();
    url = decodeURIComponent(url);
    const message: UpsertRequest<Action.UpsertNode> = {
        action: Action.UpsertNode,
        data: {
            name,
            url,
            relatedNodes: Array.from(store.value.filter((value: string) => value !== url))
        }
    }
    browser.runtime.sendMessage(message).then(window.close);
}

export function deleteItem(id: string, action: DeleteAction, stay?: boolean): void {
    const message: DeleteRequest<typeof action> = {
        action,
        data: id,
    };
    browser.runtime.sendMessage(message).then(() => {
        if (!stay) {
            window.close();
        }
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