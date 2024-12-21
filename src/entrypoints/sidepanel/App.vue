<script lang="ts" setup>
import { Action, NodeData, OperationMessage, SearchResultMessage } from '@/interface';
import { Search } from '@element-plus/icons-vue';

const keyword = ref('')
const items = ref(new Array<NodeData>())
onMounted(() => {
    search(keyword.value)
})
function search(keyword: string) {
    const message: OperationMessage = {
        action: Action.Search,
        data: keyword,
    };
    browser.runtime.sendMessage(message).then((response: SearchResultMessage) => {
        items.value = response.result;
    });
}
watch(keyword, (newKeyword) => {
    search(newKeyword)
})
function handleClickLink(url: string) {
    browser.tabs.update({ url: url });
}
</script>

<template>
    <el-container>
        <el-header class="header">
            <el-input v-model="keyword" :prefix-icon="Search" />
        </el-header>
        <el-main class="main">
            <el-row v-for="node in items" class="row" @click="() => handleClickLink(node.url)" :icon="Search">
                <el-text class="txt">{{ node.name }}</el-text>
            </el-row>
        </el-main>
    </el-container>
</template>

<style lang="scss" scoped>
@use "@/assets/styles/common.scss";

.header {
    @extend %reset;
    height: common.$bar-height;
}

$row-height: common.$bar-height*0.8;

.main {
    @extend %reset;
    height: $row-height*10;
}

.row {
    @extend %reset;
    @extend %container-row-padding;
    height: $row-height;

    &:hover {
        background-color: #409EFF;
    }
}

.txt {
    @extend %fill-container;
    @extend %text-truncate;
    align-content: center;

    &:hover {
        color: white;
        cursor: pointer;
    }
}
</style>