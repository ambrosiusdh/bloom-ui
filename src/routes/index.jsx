import { createBrowserRouter } from "react-router-dom";
import App from "../App.jsx";
import { Cashier } from "@pages/cashier/Cashier.jsx";
import { Dashboard } from "@pages/dashboard/Dashboard.jsx";
import {Login} from "@pages/login/Login.jsx";
import {ItemList} from "@pages/item/ItemList.jsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: <App/>,
        children: [
            {
                path: "",
                element: <Dashboard/>
            },
            {
                path: "cashier",
                element: <Cashier/>
            },
            {
                path: "item",
                element: <ItemList/>,
                children: []
            }
        ]
    },
    {
        path: "/login",
        element: <Login/>
    }
])

export default router