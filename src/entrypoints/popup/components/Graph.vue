<script lang="ts" setup>
import { useRouter } from 'vue-router';
import { createGraphConfig } from '@/composables/config';
import { Search } from '@element-plus/icons-vue';
import LayoutMain from '@/components/LayoutMain.vue';
import { buildSearchStates, buildSelectGraph, buildSelectedNodesStates } from '@/composables/utils';

const { keyword, data } = buildSearchStates();
const configs = computed(() => createGraphConfig(keyword.value));
const { selectedNodes, selectedNodesOld, handleClickReset } = buildSelectedNodesStates();
onMounted(() => {
    selectedNodesOld.value = Array.from(selectedNodes.value);
});
const { hoverNode, nodes, edges, eventHandlers } = buildSelectGraph(data);
const router = useRouter();
</script>

<template>
    <el-container class="container">
        <el-header class="header">
            <el-row>
                <el-col :span="8">
                    <el-button type="primary" @click="router.back">OK</el-button>
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