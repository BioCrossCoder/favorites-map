import Board from "./components/Board.vue";
import OptionList from "./components/OptionList.vue";

export const routes = [
    {
        path: '/',
        component: Board
    },
    {
        path: '/import',
        component: OptionList
    }
];