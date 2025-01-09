<script lang="ts" setup>
import LayoutMain from '@/components/LayoutMain.vue';
import { buildSearchStates } from '@/composables/utils';
import { Search } from '@element-plus/icons-vue';
import NodeList from './NodeList.vue';
import TagList from './TagList.vue';

const showTags = ref(false);
const { keyword, nodeData, tagData } = buildSearchStates();
const count = computed<number>(() => showTags.value ? tagData.value.length : nodeData.value.length);
provide('nodeData', nodeData);
provide('tagData', tagData);
</script>

<template>
    <el-container>
        <el-header class="header">
            <el-input v-model="keyword" :prefix-icon="Search">
                <template #prefix>
                    <el-text class="txt">
                        {{ count }}
                    </el-text>
                </template>
                <template #suffix>
                    <el-switch v-model="showTags" active-text="tag" inactive-text="url" inline-prompt />
                </template>
            </el-input>
        </el-header>
        <LayoutMain class="main">
            <TagList v-if="showTags" />
            <NodeList v-else />
        </LayoutMain>
    </el-container>
</template>

<style lang="scss" scoped>
@use "@/assets/styles/common.scss";

.header {
    @include common.block-with-height(common.$bar-height);
}

$row-height: common.$bar-height*0.8;

.main {
    height: $row-height*8;
}

.txt {
    color: common.$theme-blue;
}
</style>