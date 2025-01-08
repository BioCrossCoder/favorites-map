<script lang="ts" setup>
import LayoutMain from '@/components/LayoutMain.vue';
import { useGraphPositionStore, useSelectedTagsStore } from '@/composables/store';
import { buildSearchStates, upsertTag, deleteItem } from '@/composables/utils';
import { Action, TagData } from '@/interface';
import { Search, Edit, Location, Plus, Check, Close, Delete } from '@element-plus/icons-vue';
import { ElTag } from 'element-plus';

const showTags = ref(false);
const { keyword, nodeData, tagData } = buildSearchStates();
const checkList = useSelectedTagsStore().getState();
const position = useGraphPositionStore();
function handleClickEdit(url: string) {
    const urlPrefix: string = browser.runtime.getURL('/popup.html');
    const urlPath: string = `${urlPrefix}#/edit?id=${encodeURIComponent(url)}`;
    browser.action.setPopup({ popup: urlPath }).then(() => {
        browser.action.openPopup().finally(() => {
            browser.action.setPopup({ popup: urlPrefix });
        });
    });
}
const entry = ref('');
const input = ref(false);
const edit = ref('');
const canSave = computed<boolean>(() => entry.value !== '');
const canDelete = computed<boolean>(() => checkList.value.length > 0 && !input.value);
function handleClickAdd() {
    edit.value = '';
    entry.value = '';
    input.value = true;
}
function handleClickOK() {
    upsertTag(crypto.randomUUID(), entry.value, []).then((success: boolean) => {
        if (success) {
            handleClickCancel();
        } else {
            alert('Tag Name Duplicated!');
        }
    });
}
function handleClickCancel() {
    entry.value = '';
    input.value = false;
}
function handleClickDelete() {
    checkList.value.map((tag: string) => {
        deleteItem(tag, Action.DeleteTag, true);
    });
    checkList.value = [];
}
function handleClickRename(event: MouseEvent, tag: TagData) {
    event.preventDefault();
    input.value = false;
    edit.value = tag.id;
    entry.value = tag.name;
}
function handleClickFinish(event: MouseEvent, id: string) {
    event.preventDefault();
    upsertTag(id, entry.value).then((success: boolean) => {
        if (success) {
            edit.value = '';
            entry.value = '';
        } else {
            alert('Tag Name Duplicated!');
        }
    })
}
function handleClickCancelRename(event: MouseEvent) {
    event.preventDefault();
    edit.value = '';
    entry.value = '';
}
</script>

<template>
    <el-container>
        <el-header class="header">
            <el-input v-model="keyword" :prefix-icon="Search">
                <template #suffix>
                    <el-switch v-model="showTags" active-text="tag" inactive-text="url" inline-prompt />
                </template>
            </el-input>
        </el-header>
        <LayoutMain class="main" v-if="!showTags">
            <el-row v-for="node in nodeData" class="row">
                <el-tooltip placement="bottom-end">
                    <template #content>{{ node.name }}<br />{{ node.url }}</template>
                    <el-text class="txt" @click="() => browser.tabs.update({ url: node.url })" :icon="Search">
                        {{ node.name }}
                    </el-text>
                </el-tooltip>
                <el-icon size="20" class="icon" @click="() => position.set(node.url)">
                    <Location />
                </el-icon>
                <el-icon size="20" class="icon" @click="() => handleClickEdit(node.url)">
                    <Edit />
                </el-icon>
            </el-row>
        </LayoutMain>
        <LayoutMain class="main" v-else>
            <el-row class="row" justify="center">
                <el-button type="primary" @click="handleClickAdd" :disabled="input" class="icon-btn">
                    <el-icon>
                        <Plus />
                    </el-icon>
                </el-button>
                <el-button type="primary" @click="handleClickDelete" :disabled="!canDelete" class="icon-btn">
                    <el-icon>
                        <Delete />
                    </el-icon>
                </el-button>
            </el-row>
            <el-row class="row" v-if="input">
                <el-input v-model="entry">
                    <template #suffix>
                        <el-container>
                            <el-button type="text" @click="handleClickOK" :disabled="!canSave">
                                <el-icon>
                                    <Check />
                                </el-icon>
                            </el-button>
                            <el-button type="text" @click="handleClickCancel">
                                <el-icon>
                                    <Close />
                                </el-icon>
                            </el-button>
                        </el-container>
                    </template>
                </el-input>
            </el-row>
            <el-checkbox-group v-model="checkList" :max="5">
                <el-checkbox v-for="tag in tagData" :value="tag.id" class="checkbox">
                    <el-input v-if="edit === tag.id" v-model="entry">
                        <template #suffix>
                            <el-container>
                                <el-button type="text" @click="(event: MouseEvent) => handleClickFinish(event, tag.id)"
                                    :disabled="!canSave">
                                    <el-icon>
                                        <Check />
                                    </el-icon>
                                </el-button>
                                <el-button type="text" @click="handleClickCancelRename">
                                    <el-icon>
                                        <Close />
                                    </el-icon>
                                </el-button>
                            </el-container>
                        </template>
                    </el-input>
                    <el-row justify="space-between" class="check-row" v-else>
                        <el-col :span="22">
                            <el-tag type="primary">{{ tag.name }}</el-tag>
                        </el-col>
                        <el-col :span="2">
                            <el-icon size="20" class="icon"
                                @click="(event: MouseEvent) => handleClickRename(event, tag)">
                                <Edit />
                            </el-icon>
                        </el-col>
                    </el-row>
                </el-checkbox>
            </el-checkbox-group>
        </LayoutMain>
    </el-container>
</template>

<style lang="scss" scoped>
@use "@/assets/styles/common.scss";

.header {
    @include common.block-with-height(common.$bar-height);
}

$row-height: common.$bar-height*0.8;

.row {
    @extend %container-row-padding;
    @include common.block-with-height($row-height);
}

.main {
    height: $row-height*8;
}

.txt {
    @extend %text-truncate;
    @extend %hover-style;
    align-content: center;
    width: calc(100% - 2*(common.$icon-size + 2*common.$icon-padding));
}

.icon {
    @include common.icon($row-height);
    align-content: center;
}

.icon-btn {
    @extend %reset;
    height: common.$icon-size * 1.2;
    width: common.$icon-size *1.2;
    margin-left: common.$icon-size *0.6;
}

.checkbox {
    @extend %reset;
}

.check-row {
    width: calc(100vw - 2*(common.$icon-size));
    align-items: center;
}
</style>