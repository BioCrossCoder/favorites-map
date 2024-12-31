<script lang="ts" setup>
import { useGraphPositionStore } from '@/composables/store';
import * as vNG from 'v-network-graph';

// Load data and init states
const store = useFavoritesMapStore();
const data = store.search(ref(''));
const configs = ref(vNG.defineConfigs({ node: { selectable: true } }));
const position = useGraphPositionStore();
const selectedNodes = computed(() => {
    return position.value ? [position.value] : [];
});

// Calculate visible nodes
const view = computed(() => {
    if (position.value) {
        const center = store.find(position.value);
        return center.relatedNodes.concat(center.url).map(store.find);
    }
    return data.value;
});

// Build nodes
const nodes = computed<Record<string, vNG.Node>>(() => {
    const nodeMap = {} as Record<string, vNG.Node>;
    for (const node of view.value) {
        nodeMap[node.url] = { name: node.name };
    }
    return nodeMap;
});

// Build edges
const edges = computed<Record<string, vNG.Edge>>(() => {
    const edgeMap = {} as Record<string, vNG.Edge>;
    let count: number = 0;
    for (const node of view.value) {
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
        position.set(node);
    }
}
function handleClickVisit() {
    if (!position.value) {
        alert('No Target Node Selected')
    } else {
        browser.tabs.update({ url: position.value });
    }
}
function handleClickOverview() {
    position.set('');
}
</script>

<template>
    <el-container class="container">
        <el-header class="header">
            <el-button type="primary" @click="handleClickVisit">Visit</el-button>
            <el-button @click="handleClickOverview">Overview</el-button>
        </el-header>
        <el-main class="main">
            <v-network-graph id="graph" :nodes="nodes" :edges="edges" :selectedNodes="selectedNodes" :configs="configs"
                :event-handlers="eventHandlers" />
        </el-main>
    </el-container>
</template>

<style lang="scss" scoped>
@use "@/assets/styles/common.scss";

.container {
    @extend %fill-container;
}

.header {
    @extend %reset;
    height: common.$bar-height;
}

.main {
    @extend %reset;
    height: calc(100% - common.$bar-height);
}

#graph {
    $min-side-length: 300px;
    height: max($min-side-length, calc(100% - 4*common.$border-width));
    width: max($min-side-length, calc(100% - 2*common.$border-width));
    border: common.$border-width solid common.$theme-blue;
}
</style>