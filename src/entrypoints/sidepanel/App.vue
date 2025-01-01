<script lang="ts" setup>
import { useGraphPositionStore } from '@/composables/store';
import { Search, Edit, Location } from '@element-plus/icons-vue';
import Graph from './components/Graph.vue';

const keyword = ref('')
const store = useFavoritesMapStore();
const items = store.search(keyword);

function handleClickLink(url: string) {
    browser.tabs.update({ url });
}

const position = useGraphPositionStore();
function handleClickView(url: string) {
    position.set(url);
}
function handleClickEdit(url: string) {

}
</script>

<template>
    <el-container>
        <el-header class="header">
            <el-input v-model="keyword" :prefix-icon="Search" />
        </el-header>
        <el-main class="main">
            <el-row v-for="node in items" class="row">
                <el-tooltip placement="bottom-end">
                    <template #content>{{ node.name }}<br />{{ node.url }}</template>
                    <el-text class="txt" @click="() => handleClickLink(node.url)" :icon="Search">
                        {{ node.name }}
                    </el-text>
                </el-tooltip>
                <el-icon size="20" class="icon" @click="() => handleClickView(node.url)">
                    <Location />
                </el-icon>
                <el-icon size="20" class="icon" @click="() => handleClickEdit(node.url)">
                    <Edit />
                </el-icon>
            </el-row>
        </el-main>
        <el-footer class="footer">
            <Graph />
        </el-footer>
    </el-container>
</template>

<style lang="scss" scoped>
@use "@/assets/styles/common.scss";

.header {
    @extend %reset;
    height: common.$bar-height;
}

$row-height: common.$bar-height*0.8;

.row {
    @extend %reset;
    @extend %container-row-padding;
    height: $row-height;
}

$block-height: $row-height*8;

.main {
    @extend %reset;
    height: $block-height;
}

%hover-style {
    &:hover {
        color: common.$theme-blue;
        cursor: pointer;
    }
}

$icon-size: 20px;
$icon-padding: 2px;

.txt {
    @extend %text-truncate;
    @extend %hover-style;
    align-content: center;
    width: calc(100% - 2*($icon-size + 2*$icon-padding));
}

.icon {
    @extend %hover-style;
    align-content: center;
    height: $row-height;
    padding-left: $icon-padding;
    padding-right: $icon-padding;
}

.footer {
    @extend %reset;
    height: max($block-height, calc(100vh - $block-height - 1.5*common.$bar-height));
}
</style>