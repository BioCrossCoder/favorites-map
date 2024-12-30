import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import VNetworkGraph from 'v-network-graph';
import 'v-network-graph/lib/style.css';

createApp(App).use(createPinia()).use(VNetworkGraph).mount('#app');
