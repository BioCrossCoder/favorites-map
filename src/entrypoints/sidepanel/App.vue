<script lang="ts" setup>
import Graph from './components/Graph.vue';
import SearchList from './components/SearchList.vue';
</script>

<template>
    <el-container>
        <el-header class="header">
            <SearchList />
        </el-header>
        <el-footer class="footer">
            <Graph />
        </el-footer>
    </el-container>
</template>

<style lang="scss" scoped>
@use "@/assets/styles/common.scss";

.header {
    @extend %reset;
    height: calc(50vh - 2*common.$bar-height);
}

.footer {
    @extend %reset;
    height: calc(50vh + 1.5*common.$bar-height);
}
</style>