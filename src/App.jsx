import './App.css'
import { Outlet } from "react-router-dom";
import Header from "@components/app/Header.jsx";
import Sidebar from "@components/app/Sidebar.jsx";

function App() {
    return (
        <div className="bloom flex w-full h-screen bg-gray-100 dark:bg-zinc-900 text-zinc-900 dark:text-white transition duration-300">
            <Sidebar/>
            <div className="bloom__content grow">
                <Header className="bloom__content-header"/>

                <div className="bloom__content-main h-screen p-4">
                    <Outlet/>
                </div>
            </div>
        </div>
    )
}

export default App
