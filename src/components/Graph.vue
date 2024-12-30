<script lang="ts" setup>
import { Edge, Node } from 'v-network-graph';

const store = useFavoritesMapStore();
const data = store.search(ref(''));
const nodes = computed<Record<string, Node>>(() => {
    const nodeMap = {} as Record<string, Node>;
    for (const node of data.value) {
        nodeMap[node.url] = { name: node.name };
    }
    return nodeMap;
});
const edges = computed<Record<string, Edge>>(() => {
    const edgeMap = {} as Record<string, Edge>;
    let count: number = 0;
    for (const node of data.value) {
        for (const neighbour of node.relatedNodes) {
            edgeMap[String(++count)] = {
                source: node.url,
                target: neighbour,
            };
        }
    }
    return edgeMap;
});
</script>

<template>
    <v-network-graph id="graph" :nodes="nodes" :edges="edges" />
</template>

<style lang="scss" scoped>
@use "@/assets/styles/common.scss";

#graph {
    @extend %fill-container;
    border: 1px solid common.$theme-blue;
}
</style>