<script lang="ts" setup>
import CloseIconButton from './CloseIconButton.vue';

const { title } = defineProps<{ title: string }>();
</script>

<template>
    <el-row justify="space-between" align="middle">
        <el-text size="large" tag="b">{{ title }}</el-text>
        <CloseIconButton />
    </el-row>
</template>

<style lang="scss" scoped></style>