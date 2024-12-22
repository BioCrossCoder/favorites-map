<script lang="ts" setup>
import { search } from '@/composables/search';
import { NodeData } from '@/interface';
import { Node, Edge, DataSet, Network } from 'vis-network/standalone';

const data = ref(new Array<NodeData>());
const graph = ref(new Network(document.createElement('div'), {}, {}));
function loadGraph() {
    const nodes = new DataSet<Node, 'id'>();
    const nodeIndex: Record<string, number> = {};
    let id: number;
    for (const [index, node] of Object.entries(data.value)) {
        id = Number(index);
        nodes.add({
            id,
            label: node.name,
        });
        nodeIndex[node.url] = id;
    }
    const edges = new DataSet<Edge, 'id'>();
    for (const node of data.value) {
        for (const neighbour of node.relatedNodes) {
            edges.add({
                from: nodeIndex[node.url],
                to: nodeIndex[neighbour],
            });
        }
    }
    graph.value = new Network(document.getElementById('container')!, { nodes, edges }, {})
}
onBeforeMount(() => {
    search('', data);
})
onMounted(() => {
    loadGraph();
    watch(data, loadGraph);
});
</script>

<template>
    <div id="container"></div>
</template>

<style lang="scss" scoped>
@use "@/assets/styles/common.scss";

#container {
    @extend %fill-container;
    border: 1px solid common.$theme-blue;
}
</style>