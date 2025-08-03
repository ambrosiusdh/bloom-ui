import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from "react-router-dom";
import router from "./routes/index.jsx";
import theme from "@/themes/index.js";
import { ThemeProvider } from "@mui/material";

createRoot(document.getElementById('root')).render(
    <ThemeProvider theme={ theme }>
        <RouterProvider router={ router }/>
    </ThemeProvider>
)
