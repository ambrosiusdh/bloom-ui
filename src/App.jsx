import './App.scss'
import { useEffect } from "react"

import { Navigate, Outlet, useLocation, useMatches } from "react-router-dom";

import { useAuthStore } from "@stores/index.js";

import Header from "@components/app/Header.jsx";
import Loader from "@components/app/Loader.jsx";
import Sidebar from "@components/app/Sidebar.jsx";

function App() {
    const matches = useMatches();
    const location = useLocation();

    const authStatus = useAuthStore(state => state.authStatus);
    const getCurrentUser = useAuthStore(state => state.getCurrentUser);

    const hideLayout = matches.some(match => match.handle?.hideLayout);

    useEffect(() => {
        getCurrentUser()
    }, [getCurrentUser])

    if (!hideLayout && authStatus === 'checking') {
        return (
            <main
                className="flex min-h-screen items-center justify-center"
                role="status"
                aria-live="polite"
            >
                Memeriksa sesi...
            </main>
        );
    }

    if (!hideLayout && authStatus === 'unauthenticated') {
        return (
            <Navigate
                to="/login"
                replace
                state={ { from: location } }
            />
        );
    }

    return (
        <div className="bloom flex w-full min-h-screen bg-gray-100 dark:bg-zinc-900 text-zinc-900 dark:text-white transition duration-300">
            <Loader />

            { !hideLayout && <Sidebar/> }
            <div className="bloom__content flex-grow flex flex-col">
                { !hideLayout && <Header className="bloom__content-header"/> }

                <div className="bloom__content-main p-4 flex-grow">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}

export default App
