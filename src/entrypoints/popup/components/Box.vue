<script lang="ts" setup>
import { useFavoritesMapStore, useSelectedNodesStore } from "@/composables/store";
import { Search } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import EditHeader from "./EditHeader.vue";
import LayoutMain from "@/components/LayoutMain.vue";
import { buildTextState, deleteItem, upsertNode } from "@/composables/utils";
import { Action } from "@/interface";

const { text: title, isNotEmpty: canSave } = buildTextState();
const id = ref('');
const data = useFavoritesMapStore();
const store = useSelectedNodesStore();
onMounted(() => {
    browser.tabs
        .query({
            active: true,
            currentWindow: true,
        })
        .then((tabs: chrome.tabs.Tab[]) => {
            id.value = tabs[0].url as string;
            const node = data.selectNode(id.value);
            title.value = node?.name ?? tabs[0].title as string;
            store.load(node?.relatedNodes ?? []);
        });
});
const router = useRouter();
</script>

<template>
    <el-container class="container">
        <el-header class="side-row">
            <EditHeader title="Add to Favorites Map" />
        </el-header>
        <LayoutMain>
            <el-form label-width="auto" label-position="left">
                <el-form-item label="Name">
                    <el-input v-model="title" autofocus />
                </el-form-item>
                <el-form-item label="Neighbors">
                    <el-button type="primary" :icon="Search" class="search-btn"
                        @click="() => router.push({ path: '/search' })">
                        View / Select in Map
                    </el-button>
                </el-form-item>
            </el-form>
        </LayoutMain>
        <el-footer class="side-row">
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
    width: 300px;
    height: 180px;
    @extend %container-row-padding;
}

.side-row {
    @include common.block-with-height(common.$bar-height);
}

.search-btn {
    width: 100%;
}
</style>
