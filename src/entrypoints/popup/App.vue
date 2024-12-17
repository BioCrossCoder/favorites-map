<script lang="ts" setup>
import {
    Action,
    SearchMessage,
    SearchResultMessage,
    UpsertMessage,
    DeleteMessage,
    NodeData,
    OperationMessage,
} from "@/interface";

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
        })
        .then(() => fetchSelectOptions(""));
});
const candidates = ref(new Array<NodeData>());
const options = ref(new Array<NodeData>());
async function fetchSelectOptions(keyword: string) {
    const message: SearchMessage = {
        action: Action.Search,
        data: keyword,
    };
    browser.runtime.sendMessage(message).then((response: SearchResultMessage) => {
        candidates.value = response.result.filter(
            (item: NodeData) => item.url !== url.value
        );
    });
}
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
</script>

<template>
    <el-form label-width="auto" style="width: 300px; height: 180px">
        <el-form-item label="Name">
            <el-input v-model="title" />
        </el-form-item>
        <el-form-item label="Neighbours">
            <el-select v-model="options" multiple clearable collapse-tags filterable>
                <el-option v-for="item in candidates" :key="item.url" :label="item.name" :value="item.url" />
            </el-select>
        </el-form-item>
        <el-form-item>
            <el-button @click="handleClickSave">Save</el-button>
            <el-button @click="handleClickDelete">Delete</el-button>
        </el-form-item>
    </el-form>
</template>

<style lang="scss" scoped></style>
