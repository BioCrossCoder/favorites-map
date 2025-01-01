<script lang="ts" setup>
import { useFavoritesMapStore, useSelectedNodesStore } from '@/composables/store';
import * as vNG from 'v-network-graph';
import { useRouter } from 'vue-router';
import { createGraphConfig } from '@/composables/config';

// Load data and init states
const store = useFavoritesMapStore();
const data = store.search(ref(''));
const configs = createGraphConfig(false);
const selectedNodes = useSelectedNodesStore();
const selectedNodesOld = ref(new Array<string>());
onMounted(() => {
    selectedNodesOld.value = Array.from(selectedNodes.value);
});
const hoverNode = ref('');

// Build nodes
const nodes = computed<Record<string, vNG.Node>>(() => {
    const nodeMap = {} as Record<string, vNG.Node>;
    for (const node of data.value) {
        nodeMap[node.url] = {
            name: node.name,
            active: selectedNodes.has(node.name),
        };
    }
    return nodeMap;
});

// Build edges
const edges = computed<Record<string, vNG.Edge>>(() => {
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
});

// Interaction callbacks
const eventHandlers: vNG.EventHandlers = {
    'node:click': ({ node }) => {
        if (selectedNodes.has(node)) {
            selectedNodes.remove(node);
        } else {
            selectedNodes.add(node);
        }
    },
    'node:pointerover': ({ node }) => {
        hoverNode.value = store.find(node).name;
    },
    'node:pointerout': () => {
        hoverNode.value = '';
    },
    'view:click': () => {
        selectedNodes.clear();
    }
}
const router = useRouter();
function handleClickOK() {
    router.back();
}
function handleClickReset() {
    selectedNodes.clear();
    selectedNodesOld.value.forEach(selectedNodes.add);
}
</script>

<template>
    <el-container class="container">
        <el-header class="header">
            <el-button type="primary" @click="handleClickOK">OK</el-button>
            <el-button @click="handleClickReset">Reset</el-button>
            <br />
            <el-tag size="large" class="tag">{{ hoverNode }}</el-tag>
        </el-header>
        <el-main class="main">
            <v-network-graph id="graph" :nodes="nodes" :edges="edges" :selectedNodes="selectedNodes.value"
                :event-handlers="eventHandlers" :configs="configs" />
        </el-main>
    </el-container>
</template>

<style lang="scss" scoped>
@use "@/assets/styles/common.scss";

.container {
    @extend %reset;
    height: 550px;
    width: 750px;
}

$header-height: 2*common.$bar-height;

.header {
    @extend %reset;
    height: $header-height;
}

.main {
    @extend %reset;
    height: calc(100% - $header-height);
}

#graph {
    height: calc(100% - 4*common.$border-width);
    width: calc(100% - 2*common.$border-width);
}

.tag {
    @extend %row-margin;
    width: 100%;
}
</style>