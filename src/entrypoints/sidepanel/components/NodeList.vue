<script lang="ts" setup>
import { Edit, Location, Search, Link } from '@element-plus/icons-vue';
import { useGraphPositionStore } from '@/composables/store';
import { NodeData } from '@/interface';
import { isFirefox } from 'element-plus/es/utils/browser.mjs';
import { sync } from '@/composables/utils';

const data = inject('nodeData') as Ref<NodeData[]>;
const position = useGraphPositionStore();
function handleClickEdit(url: string) {
    const urlPrefix: string = browser.runtime.getURL('/popup.html');
    const urlPath: string = `${urlPrefix}#/edit?id=${encodeURIComponent(url)}`;
    if (isFirefox()) {
        sync(() => browser.browserAction.setPopup({ popup: urlPath }));
        browser.browserAction.openPopup().finally(() => {
            browser.browserAction.setPopup({ popup: urlPrefix });
        });
    } else {
        browser.action.setPopup({ popup: urlPath }).then(() => {
            browser.action.openPopup().finally(() => {
                browser.action.setPopup({ popup: urlPrefix });
            });
        });
    }
}
</script>

<template>
    <el-row v-for="node in data" class="row">
        <el-tooltip placement="bottom">
            <template #content>
                <el-row class="tip">{{ node.url }}</el-row>
            </template>
            <el-text class="txt" @click="() => browser.tabs.update({ url: node.url })" :icon="Search">
                {{ node.name }}
            </el-text>
        </el-tooltip>
        <el-icon size="20" class="icon" @click="() => browser.tabs.create({ url: node.url })">
            <Link />
        </el-icon>
        <el-icon size="20" class="icon" @click="() => position.set(node.url)">
            <Location />
        </el-icon>
        <el-icon size="20" class="icon" @click="() => handleClickEdit(node.url)">
            <Edit />
        </el-icon>
    </el-row>
</template>

<style lang="scss" scoped>
@use "@/assets/styles/common.scss";

$row-height: common.$bar-height*0.8;

.row {
    @extend %container-row-padding;
    @include common.block-with-height($row-height);
}

.tip {
    max-width: calc(100vw - 120px);
    overflow-wrap: break-word;
    word-wrap: break-word;
    word-break: break-all;
}

.txt {
    @extend %text-truncate;
    @extend %hover-style;
    align-content: center;
    width: calc(100% - 3*(common.$icon-size + 2*common.$icon-padding));
}

.icon {
    @include common.icon($row-height);
    align-content: center;
}
</style>