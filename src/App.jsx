import './App.css'
import { Outlet, useNavigate } from "react-router-dom";
import Header from "@components/app/Header.jsx";
import Sidebar from "@components/app/Sidebar.jsx";
import { useAuthStore, useLoaderStore } from "@store/index.js";
import { useEffect } from "react"
import { Loader } from "@components/app/Loader.jsx";

function App() {
    const navigate = useNavigate();
    const currentUser = useAuthStore(state => state.currentUser);
    const getCurrentUser = useAuthStore(state => state.getCurrentUser);
    const { loaderCount } = useLoaderStore()

    useEffect(() => {
        const fetchUserData = async () => {
            await getCurrentUser()
        }

        fetchUserData()
    }, [])

    useEffect(() => {
        if (currentUser !== null && !currentUser?.username) {
            navigate("/login");
        }
    }, [currentUser])

    return (
        <div className="bloom flex w-full h-screen bg-gray-100 dark:bg-zinc-900 text-zinc-900 dark:text-white transition duration-300">
            { !!loaderCount && ( <Loader /> ) }
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
