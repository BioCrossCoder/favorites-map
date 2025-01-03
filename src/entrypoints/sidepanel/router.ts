import HomePage from "./pages/Home.vue";
import ImportPage from "./pages/Import.vue";

export const routes = [
    {
        path: '/',
        component: HomePage
    },
    {
        path: '/import',
        component: ImportPage
    }
];