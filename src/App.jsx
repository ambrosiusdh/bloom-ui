import './App.scss'
import { useEffect, useState } from "react"

import { Outlet, useMatches, useNavigate } from "react-router-dom";

import { useAuthStore, useLoaderStore } from "@stores/index.js";

import Header from "@components/app/Header.jsx";
import Loader from "@components/app/Loader.jsx";
import Sidebar from "@components/app/Sidebar.jsx";

function App() {
    const navigate = useNavigate();
    const matches = useMatches();

    const currentUser = useAuthStore(state => state.currentUser);
    const getCurrentUser = useAuthStore(state => state.getCurrentUser);
    const [authChecked, setAuthChecked] = useState(false);

    const hideLayout = matches.some(match => match.handle?.hideLayout);

    useEffect(() => {
        const fetchUserData = async () => {
            await getCurrentUser()
            setAuthChecked(true)
        }

        fetchUserData()
    }, [])

    useEffect(() => {
        if (authChecked && !currentUser?.username) {
            navigate('/login', { replace: true })
        }
    }, [authChecked, currentUser]);

    return (
        <div className="bloom flex w-full min-h-screen bg-gray-100 dark:bg-zinc-900 text-zinc-900 dark:text-white transition duration-300">
            <Loader />

            { !hideLayout && <Sidebar/> }
            <div className="bloom__content flex-grow flex flex-col">
                { !hideLayout && <Header className="bloom__content-header"/> }

                <div className="bloom__content-main p-4 flex-grow">
                    <Outlet/>
                </div>
            </div>
        </div>
    )
}

export default App
