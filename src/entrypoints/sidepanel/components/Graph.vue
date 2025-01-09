<script lang="ts" setup>
import LayoutMain from '@/components/LayoutMain.vue';
import { createGraphConfig } from '@/composables/config';
import { useGraphPositionStore, useFavoritesMapStore } from '@/composables/store';
import { buildGraphEdges, buildGraphNodes, handleMouseEnter, handleMouseLeave } from '@/composables/utils';
import { NodeData } from '@/interface';
import { Download, Upload, Star, StarFilled } from '@element-plus/icons-vue';
import * as vNG from 'v-network-graph';
import { useRouter } from 'vue-router';

// Load data and init states
const store = useFavoritesMapStore();
const selectedTags = useSelectedTagsStore().getState();
const nodeData = store.filterNodes(selectedTags);
const position = useGraphPositionStore();
const configs = computed(() => {
    nodeData.value; // trigger re-render when data changes
    return createGraphConfig(position.value);
});
const selectedNodes = computed(() => position.value ? [position.value] : []);
const hoverNode = ref('');
const hintText = computed(() => hoverNode.value || position.value);

// Build graph
const view = computed(() => {
    if (position.value) {
        const center = store.selectNode(position.value) as NodeData;
        return center.relatedNodes.concat(center.url).map((node: string) => store.selectNode(node)!);
    }
    return nodeData.value;
});
const nodes = buildGraphNodes(view);
const edges = buildGraphEdges(view);
const eventHandlers: vNG.EventHandlers = {
    'node:click': ({ node }) => {
        position.set(node);
    },
    'node:pointerover': ({ node }) => {
        handleMouseEnter(store.selectNode(node)!.name, hoverNode);
    },
    'node:pointerout': () => {
        handleMouseLeave(hoverNode)
    },
}
const graph = ref<vNG.Instance>();
onMounted(() => {
    const observer = watch(graph, () => {
        if (graph.value) {
            watch(view, graph.value.panToCenter);
            observer.stop();
        }
    })
});

function handleClickVisit() {
    if (!position.value) {
        alert('No Target Node Selected')
    } else {
        browser.tabs.update({ url: position.value });
    }
}
function handleMouseLeaveHover() {
    handleMouseLeave(hoverNode);
}
function handleClickUpload() {

}
function handleMouseEnterUpload() {
    handleMouseEnter('Import', hoverNode);
}
function handleClickDownload() {

}
function handleMouseEnterDownload() {
    handleMouseEnter('Export', hoverNode);
}
const hoverStar = ref(false);
const router = useRouter();
function handleMouseEnterStar() {
    hoverStar.value = true;
    handleMouseEnter('Migrate from Favorites', hoverNode);
}
function handleMouseLeaveStar() {
    hoverStar.value = false;
    handleMouseLeaveHover();
}
</script>

<template>
    <el-container class="container">
        <el-header class="header">
            <el-row justify="space-between" class="row">
                <el-col :span="12">
                    <el-button type="primary" @click="handleClickVisit">Visit</el-button>
                    <el-button @click="() => position.set('')">Overview</el-button>
                </el-col>
                <el-col :span="5.5">
                    <el-icon size="20" class="icon" @click="handleClickUpload" @mouseenter="handleMouseEnterUpload"
                        @mouseleave="handleMouseLeaveHover">
                        <Upload />
                    </el-icon>
                    <el-icon size="20" class="icon" @click="handleClickDownload" @mouseenter="handleMouseEnterDownload"
                        @mouseleave="handleMouseLeaveHover">
                        <Download />
                    </el-icon>
                    <el-icon size="20" class="icon" @click="() => router.push({ path: '/import' })"
                        @mouseenter="handleMouseEnterStar" @mouseleave="handleMouseLeaveStar">
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