import React, { Suspense, lazy } from "react";

import { createBrowserRouter, Navigate } from "react-router-dom";

import CircularProgress from "@mui/material/CircularProgress";

import App from "@/App.jsx";

const Cashier = lazy(() => import("@pages/cashier/Cashier.jsx"));
const Dashboard = lazy(() => import("@pages/dashboard/Dashboard.jsx"));
const ItemList = lazy(() => import("@pages/item/ItemList.jsx"));
const ItemUpsert = lazy(() => import("@pages/item/ItemUpsert.jsx"));
const ItemCategoryList = lazy(() => import("@pages/item-category/ItemCategoryList.jsx"));
const ItemCategoryUpsert = lazy(() => import("@pages/item-category/ItemCategoryUpsert.jsx"));
const SaleList = lazy(() => import("@pages/sale/SaleList.jsx"));
const SaleDetail = lazy(() => import("@pages/sale/SaleDetail.jsx"));

const Login = lazy(() => import("@pages/login/Login.jsx"));
const NotFound = lazy(() => import("@pages/NotFound.jsx"));

const withSuspense = (element) => (
    <Suspense
        fallback={
            <div className="flex items-center justify-center h-full w-full">
                <CircularProgress />
            </div>
        }>
        { element }
    </Suspense>
);

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                index: true,
                element: <Navigate to="/dashboard" replace />
            },
            {
                path: "dashboard",
                element: withSuspense(<Dashboard />)
            },
            {
                path: "login",
                element: withSuspense(<Login />),
                handle: { hideLayout: true }
            },
            {
                path: "cashier",
                element: withSuspense(<Cashier />)
            },
            {
                path: "items",
                element: withSuspense(<ItemList />)
            },
            {
                path: "items/new",
                element: withSuspense(<ItemUpsert />)
            },
            {
                path: "items/:sku/edit",
                element: withSuspense(<ItemUpsert />)
            },
            {
                path: "item-categories",
                element: withSuspense(<ItemCategoryList />)
            },
            {
                path: "item-categories/new",
                element: withSuspense(<ItemCategoryUpsert />)
            },
            {
                path: "item-categories/:code/edit",
                element: withSuspense(<ItemCategoryUpsert />)
            },
            {
                path: "sales",
                element: withSuspense(<SaleList />)
            },
            {
                path: "sales/:code",
                element: withSuspense(<SaleDetail />)
            },
            {
                path: "*",
                element: withSuspense(<NotFound />)
            }
        ]
    }
]);

export default router;
