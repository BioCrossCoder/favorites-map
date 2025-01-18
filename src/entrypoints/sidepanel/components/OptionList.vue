<script lang="ts" setup>
import LayoutMain from '@/components/LayoutMain.vue';
import { useFavoritesMapStore } from '@/composables/store';
import { Action, ImportRequest, NodeData, TagData } from '@/interface';
import { Search, Switch } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { textMatch } from '@/composables/utils';

const keyword = ref('');
const store = useFavoritesMapStore();
const items = ref(new Array<NodeData>());
const categories = ref({} as Record<string, TagData>);
const cateMap = ref({} as Record<string, string[]>);
const options = computed(() => {
    const candidates = items.value.filter((node: NodeData) => !store.selectNode(node.url));
    return textMatch(candidates, keyword.value);
});
const optionCount = computed<number>(() => options.value.length);
const optionMap = computed(() => {
    const value = new Map<string, NodeData>();
    options.value.forEach((node: NodeData) => {
        value.set(node.url, node);
    });
    return value;
});
onMounted(() => {
    const nodes = new Array<NodeData>();
    const tags: Record<string, TagData> = {};
    const nodesToTagMapping: Record<string, string[]> = {};
    const dfs = (node: chrome.bookmarks.BookmarkTreeNode, parents: chrome.bookmarks.BookmarkTreeNode[]) => {
        if (node.url) {
            const graphNode: NodeData = {
                name: node.title,
                url: decodeURIComponent(node.url),
                relatedNodes: []
            }
            nodes.push(graphNode);
            parents.forEach((parentNode: chrome.bookmarks.BookmarkTreeNode) => {
                if (!Object.hasOwn(tags, parentNode.title)) {
                    tags[parentNode.title] = {
                        id: crypto.randomUUID(),
                        name: parentNode.title,
                        labeledNodes: [],
                    }
                }
                tags[parentNode.title].labeledNodes.push(graphNode.url);
            });
            nodesToTagMapping[graphNode.url] = parents.map((parentNode: chrome.bookmarks.BookmarkTreeNode) => parentNode.title);
            return;
        }
        const newParents = parents.concat(node).slice(parents.length - 4, parents.length + 1);
        node.children!.forEach((childNode: chrome.bookmarks.BookmarkTreeNode) => {
            dfs(childNode, newParents);
        });
    }
    browser.bookmarks.getTree().then((treeNodes: chrome.bookmarks.BookmarkTreeNode[]) => {
        treeNodes.forEach((node: chrome.bookmarks.BookmarkTreeNode) => {
            dfs(node, []);
        });
    }).then(() => {
        items.value = nodes;
        categories.value = tags;
        cateMap.value = nodesToTagMapping;
        checkAll.value = true;
    });
});

const checkList = ref(new Array<string>());
const checkCount = computed<number>(() => checkList.value.length);
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
    const tagIDs = new Set<string>();
    const nodes: NodeData[] = selectedOptions.value.map((node: NodeData) => {
        node.url = decodeURIComponent(node.url);
        cateMap.value[node.url].forEach((tagID: string) => tagIDs.add(tagID));
        return node;
    });
    const tags: TagData[] = Array.from(tagIDs).map((tagID: string) => categories.value[tagID]);
    const message: ImportRequest = {
        action: Action.Import,
        data: {
            nodes,
            tags,
        },
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
            <el-input v-model="keyword" :prefix-icon="Search" class="input">
                <template #suffix>
                    <el-row>
                        <el-text class="txt">
                            {{ checkCount }}
                        </el-text>
                        <el-text>
                            /{{ optionCount }}
                        </el-text>
                    </el-row>
                </template>
            </el-input>
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
    @include common.block-with-height(2*common.$bar-height);
}

.input {
    margin-bottom: common.$col-padding-margin-width;
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
    height: calc(100vh - 2.5*common.$bar-height);
}

.txt {
    color: common.$theme-blue;
}
</style>