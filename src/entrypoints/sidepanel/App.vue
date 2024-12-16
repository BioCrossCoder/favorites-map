<script lang="ts" setup>
import { Action, NodeData, OperationMessage, SearchResultMessage } from '@/interface';

const keyword = ref('')
const data = ref(new Array<NodeData>())
onMounted(() => {
    search(keyword.value)
})
function search(keyword: string) {
    const message: OperationMessage = {
        action: Action.Search,
        data: keyword,
    };
    browser.runtime.sendMessage(message).then((response: SearchResultMessage) => {
        data.value = response.result;
    });
}
watch(keyword, (newKeyword) => {
    search(newKeyword)
})
</script>

<template>
    <div>
        <input type="text" placeholder="Search favorites map" v-model="keyword" />
        <div>
            <li v-for="node in data">{{ (node as NodeData).name }}</li>
        </div>
    </div>
</template>

<style lang="scss" scoped></style>
