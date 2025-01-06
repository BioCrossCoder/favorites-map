<script lang="ts" setup>
import { useFavoritesMapStore, useSelectedNodesStore } from "@/composables/store";
import { Action, UpsertMessage, DeleteMessage, OperationMessage } from "@/interface";
import { Search } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import EditHeader from "./EditHeader.vue";
import LayoutMain from "@/components/LayoutMain.vue";

const title = ref("");
const id = ref("");
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
            const node = data.find(id.value);
            title.value = node?.name || tabs[0].title as string;
            store.load(node?.relatedNodes || []);
        });
});

function handleClick(message: OperationMessage) {
    browser.runtime.sendMessage(message).then(window.close);
}
const canSave = computed<boolean>(() => title.value.trim() !== '');
function handleClickSave() {
    const message: UpsertMessage = {
        action: Action.Upsert,
        data: {
            name: title.value,
            url: id.value,
            relatedNodes: Array.from(store.value.filter((value: string) => value !== id.value)),
        },
    };
    handleClick(message);
}
function handleClickDelete() {
    const message: DeleteMessage = {
        action: Action.Delete,
        data: id.value,
    };
    handleClick(message);
}
const router = useRouter();
function handleClickSelect() {
    router.push({
        path: '/search'
    });
}
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
                    <el-button type="primary" :icon="Search" class="search-btn" @click="handleClickSelect">
                        View / Select in Map
                    </el-button>
                </el-form-item>
            </el-form>
        </LayoutMain>
        <el-footer class="side-row">
            <el-row justify="end">
                <el-button @click="handleClickSave" type="primary" :disabled="!canSave">Save</el-button>
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
    @include common.block-with-height(common.$bar-height);
}

.search-btn {
    width: 100%;
}
</style>
