<script lang="ts" setup>
import { useFavoritesMapStore, useSelectedNodesStore } from '@/composables/store';
import * as vNG from 'v-network-graph';
import { useRouter } from 'vue-router';
import { createGraphConfig } from '@/composables/config';
import { Search } from '@element-plus/icons-vue';
import LayoutMain from '@/components/LayoutMain.vue';

// Load data and init states
const keyword = ref('');
const store = useFavoritesMapStore();
const data = store.search(keyword);
const configs = computed(() => createGraphConfig(keyword.value));
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
        hoverNode.value = store.find(node)!.name;
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
            <el-row>
                <el-col :span="8">
                    <el-button type="primary" @click="handleClickOK">OK</el-button>
                    <el-button @click="handleClickReset">Reset</el-button>
                </el-col>
                <el-col :span="8">
                    <el-input v-model="keyword" :prefix-icon="Search" class="input" />
                </el-col>
            </el-row>
            <el-row>
                <el-tag size="large" class="tag">{{ hoverNode }}</el-tag>
            </el-row>
        </el-header>
        <LayoutMain>
            <v-network-graph id="graph" :nodes="nodes" :edges="edges" :selectedNodes="selectedNodes.value"
                :event-handlers="eventHandlers" :configs="configs" />
        </LayoutMain>
    </el-container>
</template>

<style lang="scss" scoped>
@use "@/assets/styles/common.scss";

.container {
    @include common.block-with-height(550px);
    width: 750px;
}

$header-height: 2*common.$bar-height;

.header {
    @include common.block-with-height($header-height);
}

.input {
    display: inline-block;
}

#graph {
    height: calc(100% - 4*common.$border-width);
    width: calc(100% - 2*common.$border-width);
}

.tag {
    @extend %graph-tag;
}
</style>