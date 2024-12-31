import Box from './components/Box.vue';
import Graph from './components/Graph.vue';

export const routes = [
    {
        path: '/',
        component: Box,
    },
    {
        path: '/search',
        component: Graph,
    }
]