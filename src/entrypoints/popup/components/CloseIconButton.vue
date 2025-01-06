<script lang="ts" setup>
import { Close } from '@element-plus/icons-vue';

function handleClick() {
    window.close();
}
</script>

<template>
    <el-button text @click="handleClick" class="btn">
        <el-icon size="20">
            <Close />
        </el-icon>
    </el-button>
</template>

<style lang="scss" scoped>
@use "@/assets/styles/common.scss";

.btn {
    $btn-width: common.$bar-height*0.75;
    height: $btn-width;
    width: $btn-width;
}
</style>