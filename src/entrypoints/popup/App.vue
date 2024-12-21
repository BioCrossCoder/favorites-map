<script lang="ts" setup>
import {
    Action,
    UpsertMessage,
    DeleteMessage,
    NodeData,
    OperationMessage,
} from "@/interface";
import { Close, Search } from "@element-plus/icons-vue";

const title = ref("");
const url = ref("");
onMounted(() => {
    browser.tabs
        .query({
            active: true,
            currentWindow: true,
        })
        .then((tabs: chrome.tabs.Tab[]) => {
            title.value = tabs[0].title as string;
            url.value = tabs[0].url as string;
        });
});
const options = ref(new Array<NodeData>());
function handleClick(message: OperationMessage) {
    browser.runtime.sendMessage(message).then(window.close);
}
function handleClickSave() {
    const message: UpsertMessage = {
        action: Action.Upsert,
        data: {
            name: title.value,
            url: url.value,
            relatedNodes: options.value.map((item: NodeData) => item.url),
        },
    };
    handleClick(message);
}
function handleClickDelete() {
    const message: DeleteMessage = {
        action: Action.Delete,
        data: url.value,
    };
    handleClick(message);
}
function handleClickClose() {
    window.close();
}
function handleClickSelect() { }
</script>

<template>
    <el-container class="container">
        <el-header class="side-row">
            <el-row justify="space-between" align="middle">
                <el-text size="large" tag="b">Add to Favorites Map</el-text>
                <el-button text @click="handleClickClose" class="close-btn">
                    <el-icon size="20">
                        <Close />
                    </el-icon>
                </el-button>
            </el-row>
        </el-header>
        <el-main class="main">
            <el-form label-width="auto" label-position="left" class="row-with-margin">
                <el-form-item label="Name">
                    <el-input v-model="title" autofocus />
                </el-form-item>
                <el-form-item label="Neighbors">
                    <el-button type="primary" :icon="Search" class="search-btn" @click="handleClickSelect">View / Select
                        in
                        Map</el-button>
                </el-form-item>
            </el-form>
        </el-main>
        <el-footer class="side-row">
            <el-row justify="end">
                <el-button @click="handleClickSave" type="primary">Save</el-button>
                <el-button @click="handleClickDelete">Delete</el-button>
            </el-row>
        </el-footer>
    </el-container>
</template>

<style lang="scss" scoped>
@use "@/assets/styles/common.scss";

.container {
    width: 300px;
    height: 180px;
    @extend %container-row-padding;
}

.side-row {
    height: common.$bar-height;
    @extend %reset;
}

.main {
    @extend %reset;
}

.close-btn {
    $btn-width: common.$bar-height*0.75;
    height: $btn-width;
    width: $btn-width;
}

.search-btn {
    width: 100%;
}
</style>
