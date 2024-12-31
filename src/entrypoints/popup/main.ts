import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import VNetworkGraph from 'v-network-graph';
import 'v-network-graph/lib/style.css';
import { createRouter, createWebHashHistory } from 'vue-router';
import { routes } from './router';

createApp(App)
    .use(createPinia())
    .use(createRouter({
        history: createWebHashHistory(),
        routes,
    }))
    .use(VNetworkGraph)
    .mount('#app');
