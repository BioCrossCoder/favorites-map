import EditPage from './pages/Edit.vue';
import HomePage from './pages/Home.vue';
import SearchPage from './pages/Search.vue';

export const routes = [
    {
        path: '/',
        component: HomePage,
    },
    {
        path: '/search',
        component: SearchPage,
    },
    {
        path: '/edit',
        component: EditPage
    }
]