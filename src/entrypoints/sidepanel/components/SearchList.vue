<script lang="ts" setup>
import LayoutMain from '@/components/LayoutMain.vue';
import { useGraphPositionStore } from '@/composables/store';
import { buildSearchStates } from '@/composables/utils';
import { Search, Edit, Location } from '@element-plus/icons-vue';

const { keyword, data } = buildSearchStates();
const position = useGraphPositionStore();
function handleClickEdit(url: string) {
    const urlPrefix: string = browser.runtime.getURL('/popup.html');
    const urlPath: string = `${urlPrefix}#/edit?id=${encodeURIComponent(url)}`;
    browser.action.setPopup({ popup: urlPath }).then(() => {
        browser.action.openPopup().finally(() => {
            browser.action.setPopup({ popup: urlPrefix });
        });
    });
}
</script>

<template>
    <el-container>
        <el-header class="header">
            <el-input v-model="keyword" :prefix-icon="Search" />
        </el-header>
        <LayoutMain class="main">
            <el-row v-for="node in data" class="row">
                <el-tooltip placement="bottom-end">
                    <template #content>{{ node.name }}<br />{{ node.url }}</template>
                    <el-text class="txt" @click="() => browser.tabs.update({ url: node.url })" :icon="Search">
                        {{ node.name }}
                    </el-text>
                </el-tooltip>
                <el-icon size="20" class="icon" @click="() => position.set(node.url)">
                    <Location />
                </el-icon>
                <el-icon size="20" class="icon" @click="() => handleClickEdit(node.url)">
                    <Edit />
                </el-icon>
            </el-row>
        </LayoutMain>
    </el-container>
</template>

<style lang="scss" scoped>
@use "@/assets/styles/common.scss";

.header {
    @include common.block-with-height(common.$bar-height);
}

$row-height: common.$bar-height*0.8;

.row {
    @extend %container-row-padding;
    @include common.block-with-height($row-height);
}

.main {
    height: $row-height*8;
}

.txt {
    @extend %text-truncate;
    @extend %hover-style;
    align-content: center;
    $icon-size: 20px;
    width: calc(100% - 2*($icon-size + 2*common.$icon-padding));
}

.icon {
    @include common.icon($row-height);
    align-content: center;
}
</style>