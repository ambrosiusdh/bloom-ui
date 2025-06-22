import { createBrowserRouter } from "react-router-dom";
import App from "../App.jsx";
import { Cashier } from "../pages/cashier/Cashier.jsx";
import { Dashboard } from "../pages/dashboard/Dashboard.jsx";

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
            }
        ]
    }
])

export default router