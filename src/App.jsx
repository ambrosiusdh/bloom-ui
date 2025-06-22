import './App.css'
import { Outlet } from "react-router-dom";
import Header from "@components/app/Header.jsx";
import Sidebar from "@components/app/Sidebar.jsx";

function App() {
    return (
        <div className="bloom flex w-full h-screen">
            <Sidebar/>
            <div className="bloom__content grow">
                <Header/>
                <Outlet/>
            </div>
        </div>
    )
}

export default App
