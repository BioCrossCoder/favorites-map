<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { createGraphConfig } from '@/composables/config';
import EditHeader from '../components/EditHeader.vue';
import LayoutMain from '@/components/LayoutMain.vue';
import { Delete, Search } from '@element-plus/icons-vue';
import { buildSearchStates, buildSelectGraph, buildTextState, deleteItem, upsertNode, buildSelectedNodesStates, upsertTag } from '@/composables/utils';
import { useSelectedTagsStore } from '@/composables/store';
import { Action, TagData } from '@/interface';

const route = useRoute();
const { text: title, isNotEmpty: canSave } = buildTextState();
const id: string = decodeURIComponent(route.query.id as string);
const { keyword, store, nodeData } = buildSearchStates();
const tagData = store.searchTags(ref(''));
const configs = computed(() => createGraphConfig(keyword.value));
const { selectedNodes, selectedNodesOld, handleClickReset } = buildSelectedNodesStates();
const selectedTags = useSelectedTagsStore().getState();
onMounted(() => {
    setTimeout(() => {
        selectedTags.value = store.getTags(id).value.map((tag: TagData) => tag.id);
    }, 0);
    if (route.query.name) {
        title.value = route.query.name as string;
        selectedNodesOld.value = Array.from(selectedNodes.value);
        return;
    }
    const observer = watch(nodeData, () => {
        if (nodeData.value.length > 0) {
            const node = store.selectNode(id);
            title.value = node!.name;
            selectedNodes.load(node!.relatedNodes);
            selectedNodesOld.value = Array.from(selectedNodes.value);
            observer.stop();
        }
    });
});
const { hoverNode, nodes, edges, eventHandlers } = buildSelectGraph(nodeData);
const nodeTotalCount = computed<number>(() => nodeData.value.length);
const selectedNodeCount = computed<number>(() => selectedNodes.value.length);
function createTagIfNotExist() {
    if (selectedTags.value.length > 5) {
        return;
    }
    for (const tag of selectedTags.value) {
        if (!store.selectTag(tag)) {
            const tagID = crypto.randomUUID();
            upsertTag(tagID, tag, []).then(() => {
                selectedTags.value[selectedTags.value.length - 1] = tagID;
            });
            break;
        }
    }
}
function handleDelete(event: MouseEvent, tagID: string) {
    event.preventDefault();
    deleteItem(tagID, Action.DeleteTag, true);
}
</script>

<template>
    <el-container class="container">
        <el-header class="header">
            <EditHeader title="Edit Favorites Map" class="bar" />
            <el-form label-width="auto" label-position="left">
                <el-form-item label="Name">
                    <el-input v-model="title" autofocus />
                </el-form-item>
                <el-form-item label="URL">
                    <el-input v-model="id" disabled />
                </el-form-item>
                <el-form-item label="Tags">
                    <el-select v-model="selectedTags" multiple :multiple-limit="5" filterable autocomplete="on"
                        clearable allow-create default-first-option @change="createTagIfNotExist">
                        <template #label="{ label }">
                            <el-tooltip placement="bottom" :content="label">
                                <el-row class="txt" justify="center">{{ label }}</el-row>
                            </el-tooltip>
                        </template>
                        <el-option v-for="item in tagData" :key="item.id" :label="item.name" :value="item.id">
                            <el-row justify="space-between" align="middle">
                                <el-tag type="primary">{{ item.name }}</el-tag>
                                <el-button type="text" class="icon"
                                    @click="(event: MouseEvent) => handleDelete(event, item.id)">
                                    <el-icon>
                                        <Delete />
                                    </el-icon>
                                </el-button>
                            </el-row>
                        </el-option>
                    </el-select>
                </el-form-item>
            </el-form>
            <el-row>
                <el-col :span="8">
                    <el-button @click="handleClickReset">Reset</el-button>
                </el-col>
                <el-col :span="16">
                    <el-input v-model="keyword" :prefix-icon="Search" class="input">
                        <template #suffix>
                            <el-row>
                                <el-text class="cnt">
                                    {{ selectedNodeCount }}
                                </el-text>
                                <el-text>
                                    /{{ nodeTotalCount }}
                                </el-text>
                            </el-row>
                        </template>
                    </el-input>
                </el-col>
            </el-row>
            <el-row>
                <el-tag size="large" class="tag">{{ hoverNode }}</el-tag>
            </el-row>
        </el-header>
        <LayoutMain>
            <v-network-graph id="graph" :nodes="nodes" :edges="edges" :selectedNodes="selectedNodes.value"
                :eventHandlers="eventHandlers" :configs="configs" />
        </LayoutMain>
        <el-footer class="footer">
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
    width: 450px;
    height: 580px;
    @extend %container-row-padding;
}

.header {
    @include common.block-with-height(6.5*common.$bar-height);
}

.bar {
    margin-bottom: common.$col-padding-margin-width;
}

.txt {
    width: 25px;
}

.input {
    display: inline-block;
}

.cnt {
    color: common.$theme-blue;
}

.tag {
    @extend %graph-tag;
}

#graph {
    height: calc(100% - 4*common.$border-width);
    width: calc(100% - 2*common.$border-width);
}

.footer {
    @include common.block-with-height(common.$bar-height);
}

.icon {
    color: grey;

    &:hover {
        color: red;
    }
}
</style>