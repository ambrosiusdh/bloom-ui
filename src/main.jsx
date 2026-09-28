import { createRoot } from 'react-dom/client'
import { RouterProvider } from "react-router-dom";
import { SnackbarProvider } from "notistack";

import { AppearanceProvider } from "@/themes/AppearanceProvider.jsx";

import './index.css'
import router from "./routes/index.jsx";

createRoot(document.getElementById('root')).render(
    <AppearanceProvider>
        <SnackbarProvider>
            <RouterProvider router={ router }/>
        </SnackbarProvider>
    </AppearanceProvider>
)
