import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "@/App.jsx";
import { Cashier } from "@pages/cashier/Cashier.jsx";
import { Dashboard } from "@pages/dashboard/Dashboard.jsx";
import { Login } from "@pages/login/Login.jsx";
import { ItemList } from "@pages/item/ItemList.jsx";
import NotFound from "@pages/NotFound.jsx";
import { ItemCreate } from "@pages/item/ItemCreate.jsx";
import { ItemCategoryList } from "@pages/item-category/ItemCategoryList.jsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: <App/>,
        children: [
            {
                index: true,
                element: <Navigate to="/dashboard" replace />
            },

            {
                path: "dashboard",
                element: <Dashboard />
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
                path: "items/create",
                element: <ItemCreate/>
            },

            {
                path: "item-categories",
                element: <ItemCategoryList />
            },

            {
                path: "*",
                element: <NotFound/>
            }
        ]
    }
])

export default router