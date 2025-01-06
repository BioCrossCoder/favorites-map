import { Action, DeleteMessage, NodeData, OperationMessage, UpsertMessage } from "@/interface";
import * as vNG from 'v-network-graph';
import { useSelectedNodesStore, useFavoritesMapStore } from "./store";

export function closeWindowAfterSendMessage(message: OperationMessage) {
    browser.runtime.sendMessage(message).then(window.close);
}

export function doUpsert(name: string, url: string) {
    const store = useSelectedNodesStore();
    const message: UpsertMessage = {
        action: Action.Upsert,
        data: {
            name,
            url,
            relatedNodes: Array.from(store.value.filter((value: string) => value !== url))
        }
    }
    closeWindowAfterSendMessage(message);
}

export function doDelete(id: string) {
    const message: DeleteMessage = {
        action: Action.Delete,
        data: id,
    };
    closeWindowAfterSendMessage(message);
}

export function handleMouseEnter(message: string, state: Ref<string>) {
    state.value = message;
}

export function handleMouseLeave(state: Ref<string>) {
    state.value = '';
}

export function buildGraphNodes(data: Ref<NodeData[]>, activator?: (node: string) => boolean) {
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

export function buildGraphEdges(data: Ref<NodeData[]>) {
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
            hover.value = store.find(node)!.name;
        },
        'node:pointerout': () => {
            hover.value = '';
        },
        'view:click': () => {
            selectedNodes.clear();
        }
    }
}

export function storeGraphSelectedNodes() {
    const state = useSelectedNodesStore();
    const oldState = ref(new Array<string>());
    function reset() {
        state.clear();
        oldState.value.forEach(state.add);
    }
    return {
        oldState,
        reset
    }
}

export function buildSelectGraph(data: Ref<NodeData[]>) {
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