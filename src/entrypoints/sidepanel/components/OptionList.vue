<script lang="ts" setup>
import LayoutMain from '@/components/LayoutMain.vue';
import { useFavoritesMapStore } from '@/composables/store';
import { Action, ImportMessage, NodeData } from '@/interface';
import { Switch } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';

const store = useFavoritesMapStore();
const items = ref(new Array<NodeData>());
const options = computed(() => items.value.filter((node: NodeData) => !store.find(node.url)));
const optionMap = computed(() => {
    const value = new Map<string, NodeData>();
    options.value.forEach((node: NodeData) => {
        value.set(node.url, node);
    })
    return value;
})
onMounted(() => {
    const nodes = new Array<NodeData>();
    const dfs = (node: chrome.bookmarks.BookmarkTreeNode) => {
        if (node.url) {
            nodes.push({
                name: node.title,
                url: node.url,
                relatedNodes: []
            });
        }
        node.children?.forEach(dfs);
    }
    browser.bookmarks.getTree().then((treeNodes: chrome.bookmarks.BookmarkTreeNode[]) => {
        treeNodes.forEach(dfs);
    }).then(() => {
        items.value = nodes;
        checkAll.value = true;
    });
});

const checkList = ref(new Array<string>());
const checkSet = computed(() => new Set(checkList.value));
const indeterminate = computed(() => checkList.value.length > 0 && checkList.value.length < options.value.length);
const checkAll = computed({
    get: () => checkList.value.length === options.value.length,
    set(ok: boolean) {
        checkList.value = options.value.map((node: NodeData) => node.url).filter(() => indeterminate.value || ok);
    }
});
const selectedOptions = computed(() => checkList.value.map((url: string) => optionMap.value.get(url)!));
function handleClickOK() {
    const message: ImportMessage = {
        action: Action.Import,
        data: selectedOptions.value,
    }
    browser.runtime.sendMessage(message).then(router.back);
}
const router = useRouter();
const showURL = ref(false);
function handleClickSwitch() {
    checkList.value = Array.from(optionMap.value.keys().filter((value: string) => !checkSet.value.has(value)));
}
</script>

<template>
    <el-container>
        <el-header class="header">
            <el-row justify="space-between">
                <el-col :span="10">
                    <el-button type="primary" @click="handleClickOK">OK</el-button>
                    <el-button @click="router.back">Cancel</el-button>
                </el-col>
                <el-col :span="showURL ? 3 : 4">
                    <el-switch v-model="showURL" active-text="url" inactive-text="name" inline-prompt />
                </el-col>
                <el-col :span="8">
                    <el-button class="txt-btn">
                        <el-checkbox label="Select All" v-model="checkAll" :indeterminate="indeterminate" />
                    </el-button>
                    <el-button class="txt-btn">
                        <el-icon @click="handleClickSwitch">
                            <Switch />
                        </el-icon>
                    </el-button>
                </el-col>
            </el-row>
        </el-header>
        <LayoutMain class="main">
            <el-checkbox-group v-model="checkList">
                <el-row v-for="node in options">
                    <el-checkbox :label="showURL ? node.url : node.name" :value="node.url" />
                </el-row>
            </el-checkbox-group>
        </LayoutMain>
    </el-container>
</template>

<style lang="scss" scoped>
@use "@/assets/styles/common.scss";

.header {
    @include common.block-with-height(common.$bar-height);
}

.txt-btn {
    @extend %reset;
    @extend %row-margin;
    border: 0;

    &:hover {
        border: 0;
        background-color: transparent;
    }
}

.main {
    height: calc(100vh - 1.5*common.$bar-height);
}
</style>