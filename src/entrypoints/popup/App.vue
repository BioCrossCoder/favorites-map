<script lang="ts" setup>
import { Action, SearchMessage, SearchResultMessage, UpsertMessage, DeleteMessage } from '@/interface';

const title = ref('')
const url = ref('')
onMounted(() => {
    browser.tabs.query({
        active: true,
        currentWindow: true,
    }).then((tabs: chrome.tabs.Tab[]) => {
        title.value = tabs[0].title as string
        url.value = tabs[0].url as string
    }).then(() => fetchSelectOptions(''))
})
const options = ref(new Array<string>())
const option = ref('')
async function fetchSelectOptions(keyword: string) {
    const message: SearchMessage = {
        action: Action.Search,
        data: keyword,
    };
    browser.runtime
        .sendMessage(message)
        .then((response: SearchResultMessage) => {
            options.value = response.result.map((item) => item.name);
        });
}
function handleClickSave() {
    const message: UpsertMessage = {
        action: Action.Upsert,
        data: {
            name: title.value,
            url: url.value,
            relatedNodeNames: [],
        },
    };
    browser.runtime.sendMessage(message).then(() => {
        // window.close();
    });
}
function handleClickDelete() {
    const message: DeleteMessage = {
        action: Action.Delete,
        data: url.value,
    };
    browser.runtime.sendMessage(message);
    window.close();
}
</script>

<template>
    <div>
        <input type="text" v-model="title" />
        <select v-model="option">
            <option v-for="item in options">{{ item }}</option>
        </select>
        <button @click="handleClickSave">Save</button>
        <button @click="handleClickDelete">Delete</button>
    </div>
</template>

<style lang="scss" scoped></style>
