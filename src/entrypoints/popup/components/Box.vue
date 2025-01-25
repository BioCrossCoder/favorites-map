<script lang="ts" setup>
import { useFavoritesMapStore, useSelectedNodesStore } from "@/composables/store";
import { Search } from "@element-plus/icons-vue";
import { useRoute, useRouter } from "vue-router";
import EditHeader from "./EditHeader.vue";
import LayoutMain from "@/components/LayoutMain.vue";
import { buildTextState, deleteItem, upsertNode } from "@/composables/utils";
import { Action } from "@/interface";

const { text: title, isNotEmpty: canSave } = buildTextState();
const id = ref('');
const data = useFavoritesMapStore();
const store = useSelectedNodesStore();
const route = useRoute();
onMounted(() => {
    browser.tabs
        .query({
            active: true,
            currentWindow: true,
        })
        .then((tabs: chrome.tabs.Tab[]) => {
            id.value = tabs[0].url as string;
            const node = data.selectNode(id.value);
            title.value = route.query?.name as string ?? node?.name ?? tabs[0].title as string;
            store.load(node?.relatedNodes ?? []);
        });
});
const router = useRouter();
function handleClickMore() {
    router.push({
        path: '/edit',
        query: {
            id: id.value,
            name: title.value,
        },
    });
}
function handleClickSearch() {
    router.push({
        path: '/search',
        query: {
            name: title.value,
        }
    })
}
</script>

<template>
    <el-container class="container">
        <el-header class="header">
            <EditHeader title="Add to Favorites Map" />
        </el-header>
        <LayoutMain>
            <el-form label-width="auto" label-position="left">
                <el-form-item label="Name">
                    <el-input v-model="title" autofocus />
                </el-form-item>
                <el-form-item label="Neighbors">
                    <el-button type="primary" :icon="Search" class="search-btn" @click="handleClickSearch">
                        View / Select in Map
                    </el-button>
                </el-form-item>
            </el-form>
        </LayoutMain>
        <el-footer class="footer">
            <el-row justify="space-between">
                <el-col :span="7">
                    <el-button @click="handleClickMore" type="primary">More</el-button>
                </el-col>
                <el-col :span="14">
                    <el-button @click="() => upsertNode(title, id)" type="primary" :disabled="!canSave">Save</el-button>
                    <el-button @click="() => deleteItem(id, Action.DeleteNode)">Delete</el-button>
                </el-col>
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

.header {
    @include common.block-with-height(common.$bar-height);
}

.search-btn {
    width: 100%;
}

.footer {
    @extend .header;
    width: 100vw;
}
</style>
