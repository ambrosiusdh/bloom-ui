import {
    createBrowserRouter,
    Navigate
} from "react-router-dom";

import { Cashier } from "@pages/cashier/Cashier.jsx";
import { Dashboard } from "@pages/dashboard/Dashboard.jsx";
import { ItemList } from "@pages/item/ItemList.jsx";
import { ItemUpsert } from "@pages/item/ItemUpsert.jsx";
import { ItemCategoryList } from "@pages/item-category/ItemCategoryList.jsx";
import { ItemCategoryUpsert } from "@pages/item-category/ItemCategoryUpsert.jsx"
import { Login } from "@pages/login/Login.jsx";
import NotFound from "@pages/NotFound.jsx";

import App from "@/App.jsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: <App/>,
        children: [
            {
                index: true,
                element: <Navigate to="/dashboard" replace/>
            },

            {
                path: "dashboard",
                element: <Dashboard/>
            },

            {
                path: "login",
                element: <Login/>,
                handle: {
                    hideLayout: true
                }
            },

            {
                path: "cashier",
                element: <Cashier/>
            },

            {
                path: "items",
                element: <ItemList/>
            },

            {
                path: "items/new",
                element: <ItemUpsert/>
            },

            {
                path: "items/:sku/edit",
                element: <ItemUpsert/>
            },

            {
                path: "item-categories",
                element: <ItemCategoryList/>
            },

            {
                path: "item-categories/new",
                element: <ItemCategoryUpsert/>
            },

            {
                path: "item-categories/:code/edit",
                element: <ItemCategoryUpsert/>
            },

            {
                path: "*",
                element: <NotFound/>
            }
        ]
    }
])

export default router