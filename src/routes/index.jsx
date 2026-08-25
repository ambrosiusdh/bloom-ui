import React, { Suspense, lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";

import App from "@/App.jsx";

const Cashier = lazy(() => import("@pages/cashier/Cashier.jsx"));
const Dashboard = lazy(() => import("@pages/dashboard/Dashboard.jsx"));
const ItemList = lazy(() => import("@pages/item/ItemList.jsx"));
const ItemCreate = lazy(() => import("@pages/item/ItemCreate.jsx"));
const ItemEdit = lazy(() => import("@pages/item/ItemEdit.jsx"));
const ItemCategoryList = lazy(() => import("@pages/item-category/ItemCategoryList.jsx"));
const ItemCategoryUpsert = lazy(() => import("@pages/item-category/ItemCategoryUpsert.jsx"));
const SaleList = lazy(() => import("@pages/sale/SaleList.jsx"));
const SaleDetail = lazy(() => import("@pages/sale/SaleDetail.jsx"));

const GoodsReceiptList = lazy(() => import("@pages/goods-receipt/GoodsReceiptList.jsx"));
const GoodsReceiptCreate = lazy(() => import("@pages/goods-receipt/GoodsReceiptCreate.jsx"));
const GoodsReceiptDetail = lazy(() => import("@pages/goods-receipt/GoodsReceiptDetail.jsx"));

const StockAdjustmentList = lazy(() => import("@pages/stock-adjustment/StockAdjustmentList.jsx"));
const StockAdjustmentCreate = lazy(() => import("@pages/stock-adjustment/StockAdjustmentCreate.jsx"));
const StockAdjustmentDetail = lazy(() => import("@pages/stock-adjustment/StockAdjustmentDetail.jsx"));
const StockMovementList = lazy(() => import("@pages/stock-movement/StockMovementList.jsx"));

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
                element: withSuspense(<Cashier />),
                handle: { cashierMode: true }
            },
            {
                path: "items",
                element: withSuspense(<ItemList />)
            },
            {
                path: "items/new",
                element: withSuspense(<ItemCreate />)
            },
            {
                path: "items/:sku/edit",
                element: withSuspense(<ItemEdit />)
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
                path: "goods-receipts",
                element: withSuspense(<GoodsReceiptList />)
            },
            {
                path: "goods-receipts/new",
                element: withSuspense(<GoodsReceiptCreate />)
            },
            {
                path: "goods-receipts/:code",
                element: withSuspense(<GoodsReceiptDetail />)
            },
            {
                path: "stock-adjustments",
                element: withSuspense(<StockAdjustmentList />)
            },
            {
                path: "stock-adjustments/new",
                element: withSuspense(<StockAdjustmentCreate />)
            },
            {
                path: "stock-adjustments/:code",
                element: withSuspense(<StockAdjustmentDetail />)
            },
            {
                path: "stock-movements",
                element: withSuspense(<StockMovementList />)
            },
            {
                path: "*",
                element: withSuspense(<NotFound />)
            }
        ]
    }
]);

export default router;
