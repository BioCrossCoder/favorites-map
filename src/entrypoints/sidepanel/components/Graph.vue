<script lang="ts" setup>
import LayoutMain from '@/components/LayoutMain.vue';
import { createGraphConfig } from '@/composables/config';
import { useFavoritesMapStore, useGraphPositionStore } from '@/composables/store';
import { NodeData } from '@/interface';
import { Download, Upload, Star, StarFilled } from '@element-plus/icons-vue';
import * as vNG from 'v-network-graph';
import { useRouter } from 'vue-router';

// Load data and init states
const store = useFavoritesMapStore();
const data = store.search(ref(''));
const position = useGraphPositionStore();
const configs = computed(() => createGraphConfig(position.value));
const selectedNodes = computed(() => position.value ? [position.value] : []);
const hoverNode = ref('');
const hintText = computed(() => hoverNode.value || position.value);

// Calculate visible nodes
const view = computed(() => {
    if (position.value) {
        const center = store.find(position.value) as NodeData;
        return center.relatedNodes.concat(center.url).map(store.find);
    }
    return data.value;
});

// Build nodes
const nodes = computed<Record<string, vNG.Node>>(() => {
    const nodeMap = {} as Record<string, vNG.Node>;
    for (const node of view.value) {
        nodeMap[node!.url] = { name: node!.name };
    }
    return nodeMap;
});

// Build edges
const edges = computed<Record<string, vNG.Edge>>(() => {
    const edgeMap = {} as Record<string, vNG.Edge>;
    let count: number = 0;
    for (const node of view.value) {
        for (const neighbor of node!.relatedNodes) {
            edgeMap[String(++count)] = {
                source: node!.url,
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
    },
    'node:pointerover': ({ node }) => {
        hoverNode.value = store.find(node)!.name;
    },
    'node:pointerout': () => {
        hoverNode.value = '';
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
const graph = ref<vNG.Instance>();
watch([nodes, edges], async () => {
    setTimeout(graph.value!.panToCenter, 0);
});
function handleClickUpload() {

}
function handleClickDownload() {

}
const hoverStar = ref(false);
const router = useRouter();
function handleClickStar() {
    router.push({
        path: '/import'
    });
}
function handleMouseEnterStar() {
    hoverStar.value = true;
}
function handleMouseLeaveStar() {
    hoverStar.value = false;
}
</script>

<template>
    <el-container class="container">
        <el-header class="header">
            <el-row justify="space-between" class="row">
                <el-col :span="12">
                    <el-button type="primary" @click="handleClickVisit">Visit</el-button>
                    <el-button @click="handleClickOverview">Overview</el-button>
                </el-col>
                <el-col :span="5.5">
                    <el-icon size="20" class="icon" @click="handleClickUpload">
                        <Upload />
                    </el-icon>
                    <el-icon size="20" class="icon" @click="handleClickDownload">
                        <Download />
                    </el-icon>
                    <el-icon size="20" class="icon" @click="handleClickStar" @mouseenter="handleMouseEnterStar"
                        @mouseleave="handleMouseLeaveStar">
                        <StarFilled v-if="hoverStar" />
                        <Star v-else />
                    </el-icon>
                </el-col>
            </el-row>
            <el-row>
                <el-tag size="large" class="tag">{{ hintText }}</el-tag>
            </el-row>
        </el-header>
        <LayoutMain>
            <v-network-graph id="graph" :nodes="nodes" :edges="edges" :selectedNodes="selectedNodes" :configs="configs"
                :event-handlers="eventHandlers" ref="graph" />
        </LayoutMain>
    </el-container>
</template>

<style lang="scss" scoped>
@use "@/assets/styles/common.scss";

.container {
    @extend %fill-container;
}

$header-height: 2*common.$bar-height;

.header {
    @include common.block-with-height($header-height);
}

.row {
    height: common.$bar-height;
}

#graph {
    $min-side-length: 300px;
    height: max($min-side-length, calc(100% - 4*common.$border-width));
    width: max($min-side-length, calc(100% - 2*common.$border-width));
    border: common.$border-width solid common.$theme-blue;
}

.tag {
    @extend %graph-tag;
    display: inline-block;
    text-align: center;
    align-content: center;
    white-space: normal;
    word-break: break-all;
}

.icon {
    @include common.icon(0.8*common.$bar-height);
}
</style>