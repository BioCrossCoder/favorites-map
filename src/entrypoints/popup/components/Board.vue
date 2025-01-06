<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { useFavoritesMapStore, useSelectedNodesStore } from '@/composables/store';
import * as vNG from 'v-network-graph';
import { createGraphConfig } from '@/composables/config';
import EditHeader from '../components/EditHeader.vue';
import LayoutMain from '@/components/LayoutMain.vue';
import { Action, DeleteMessage, OperationMessage, UpsertMessage } from '@/interface';
import { Search } from '@element-plus/icons-vue';

// Load data and init states
const route = useRoute();
const title = ref('');
const id: string = decodeURIComponent(route.query.id as string);
const store = useFavoritesMapStore();
const keyword = ref('');
const data = store.search(keyword);
const configs = computed(() => createGraphConfig(keyword.value));
const selectedNodes = useSelectedNodesStore();
const selectedNodesOld = ref(new Array<string>());

onMounted(() => {
    setTimeout(() => {
        const node = store.find(id);
        title.value = node!.name;
        selectedNodes.load(node!.relatedNodes);
        selectedNodesOld.value = Array.from(selectedNodes.value);
    }, 0);
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
function handleClickReset() {
    selectedNodes.clear();
    selectedNodesOld.value.forEach(selectedNodes.add);
}
function handleClick(message: OperationMessage) {
    browser.runtime.sendMessage(message).then(window.close);
}
const canSave = computed<boolean>(() => title.value.trim() !== '');
function handleClickOK() {
    const message: UpsertMessage = {
        action: Action.Upsert,
        data: {
            name: title.value,
            url: id,
            relatedNodes: Array.from(selectedNodes.value.filter((value: string) => value !== id)),
        },
    };
    handleClick(message);
}
function handleClickDelete() {
    const message: DeleteMessage = {
        action: Action.Delete,
        data: id,
    }
    handleClick(message);
}
</script>

<template>
    <el-container class="container">
        <el-header class="header">
            <EditHeader title="Edit Favorites Map" class="bar" />
            <el-form label-width="auto" label-position="left">
                <el-form-item label="Name">
                    <el-input v-model="title" autofocus />
                </el-form-item>
                <el-form-item label="URL">
                    <el-input v-model="id" disabled />
                </el-form-item>
            </el-form>
            <el-row>
                <el-col :span="8">
                    <el-button @click="handleClickReset">Reset</el-button>
                </el-col>
                <el-col :span="16">
                    <el-input v-model="keyword" :prefix-icon="Search" class="input" />
                </el-col>
            </el-row>
            <el-row>
                <el-tag size="large" class="tag">{{ hoverNode }}</el-tag>
            </el-row>
        </el-header>
        <LayoutMain>
            <v-network-graph id="graph" :nodes="nodes" :edges="edges" :selectedNodes="selectedNodes.value"
                :eventHandlers="eventHandlers" :configs="configs" />
        </LayoutMain>
        <el-footer class="footer">
            <el-row justify="end">
                <el-button @click="handleClickOK" type="primary" :disabled="!canSave">Save</el-button>
                <el-button @click="handleClickDelete">Delete</el-button>
            </el-row>
        </el-footer>
    </el-container>

</template>

<style lang="scss" scoped>
@use "@/assets/styles/common.scss";

.container {
    width: 450px;
    height: 580px;
    @extend %container-row-padding;
}

.header {
    @include common.block-with-height(5*common.$bar-height);
}

.bar {
    margin-bottom: common.$col-padding-margin-width;
}

.input {
    display: inline-block;
}

.tag {
    @extend %graph-tag;
}

#graph {
    height: calc(100% - 4*common.$border-width);
    width: calc(100% - 2*common.$border-width);
}

.footer {
    @include common.block-with-height(common.$bar-height);
}
</style>