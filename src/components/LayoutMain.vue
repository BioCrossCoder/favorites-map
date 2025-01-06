<script lang="ts" setup></script>

<template>
    <el-main class="main">
        <slot></slot>
    </el-main>
</template>

<style lang="scss" scoped>
@use "@/assets/styles/common.scss";

.main {
    @extend %reset;
}
</style>