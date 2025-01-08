<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { createGraphConfig } from '@/composables/config';
import EditHeader from '../components/EditHeader.vue';
import LayoutMain from '@/components/LayoutMain.vue';
import { Search } from '@element-plus/icons-vue';
import { buildSearchStates, buildSelectGraph, buildTextState, deleteItem, upsertNode, buildSelectedNodesStates } from '@/composables/utils';
import { Action } from '@/interface';

const route = useRoute();
const { text: title, isNotEmpty: canSave } = buildTextState();
const id: string = decodeURIComponent(route.query.id as string);
const { keyword, store, nodeData: data } = buildSearchStates();
const configs = computed(() => createGraphConfig(keyword.value));
const { selectedNodes, selectedNodesOld, handleClickReset } = buildSelectedNodesStates();
onMounted(() => {
    const observer = watch(data, () => {
        if (data.value.length > 0) {
            const node = store.selectNode(id);
            title.value = node!.name;
            selectedNodes.load(node!.relatedNodes);
            selectedNodesOld.value = Array.from(selectedNodes.value);
            observer.stop();
        }
    });
});
const { hoverNode, nodes, edges, eventHandlers } = buildSelectGraph(data);
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
                <el-button @click="() => upsertNode(title, id)" type="primary" :disabled="!canSave">Save</el-button>
                <el-button @click="() => deleteItem(id, Action.DeleteNode)">Delete</el-button>
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