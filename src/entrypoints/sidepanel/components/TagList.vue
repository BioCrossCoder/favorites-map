<script lang="ts" setup>
import { Action, TagData } from '@/interface';
import { upsertTag, deleteItem } from '@/composables/utils';
import { useSelectedTagsStore } from '@/composables/store';
import { Plus, Delete, Check, Close, Edit } from '@element-plus/icons-vue';

const data = inject('tagData') as Ref<TagData[]>;
const checkList = useSelectedTagsStore().getState();
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
    <el-checkbox-group v-model="checkList" :max="5" class="checkgroup">
        <el-checkbox v-for="tag in data" :value="tag.id" class="checkbox">
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
                <el-col :span="21">
                    <el-tag type="primary">{{ tag.name }}</el-tag>
                </el-col>
                <el-col :span="3">
                    <el-icon size="20" class="icon" @click="(event: MouseEvent) => handleClickRename(event, tag)">
                        <Edit />
                    </el-icon>
                </el-col>
            </el-row>
        </el-checkbox>
    </el-checkbox-group>
</template>

<style lang="scss" scoped>
@use "@/assets/styles/common.scss";

$row-height: common.$bar-height*0.8;

.row {
    @extend %container-row-padding;
    @include common.block-with-height($row-height);
}

.check-row {
    width: calc(100vw - 2*(common.$icon-size));
    align-items: center;
}

.checkgroup {
    overflow-x: hidden;
}

.checkbox {
    @extend %reset;
}

.icon-btn {
    @extend %reset;
    height: common.$icon-size * 1.2;
    width: common.$icon-size *1.2;
    margin-left: common.$icon-size *0.6;
}

.icon {
    @include common.icon($row-height);
    align-content: center;
}
</style>