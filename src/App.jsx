import { useEffect, useRef } from "react"
import { Navigate, Outlet, useLocation, useMatches } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

import Header from "@components/app/Header.jsx";
import Loader from "@components/app/Loader.jsx";
import Sidebar from "@components/app/Sidebar.jsx";
import { useAuthStore } from "@stores/index.js";

import './App.scss'

function App() {
    const matches = useMatches();
    const location = useLocation();
    const navigationToggleRef = useRef(null);

    const authStatus = useAuthStore(state => state.authStatus);
    const getCurrentUser = useAuthStore(state => state.getCurrentUser);

    const hideLayout = matches.some(match => match.handle?.hideLayout);
    const isCashierMode = matches.some(match => match.handle?.cashierMode);
    const contentMainSpacing = hideLayout
        ? 'bloom__content-main--standalone'
        : isCashierMode
            ? 'bloom__content-main--cashier'
            : 'p-4';

    useEffect(() => {
        getCurrentUser()
    }, [getCurrentUser])

    useEffect(() => {
        if (location.state?.focusPageHeading !== true) {
            return undefined;
        }

        let animationFrame;
        let observer;

        const focusPageHeading = () => {
            const heading = document.querySelector(
                '.bloom__content-main h1, .bloom__content-main h2'
            );

            if (!heading) {
                return false;
            }

            if (!heading.hasAttribute('tabindex')) {
                heading.setAttribute('tabindex', '-1');
            }

            heading.classList.add('bloom-route-focus-target');
            heading.focus();
            observer?.disconnect();
            return true;
        };

        animationFrame = requestAnimationFrame(() => {
            if (focusPageHeading()) {
                return;
            }

            observer = new MutationObserver(focusPageHeading);
            observer.observe(document.querySelector('.bloom__content-main') || document.body, {
                childList: true,
                subtree: true
            });
        });

        return () => {
            cancelAnimationFrame(animationFrame);
            observer?.disconnect();
        };
    }, [
        location.hash,
        location.pathname,
        location.search,
        location.state?.focusPageHeading
    ]);

    if (!hideLayout && authStatus === 'checking') {
        return (
            <main
                className="bloom bloom-auth-checking"
                role="status"
                aria-live="polite"
                aria-labelledby="bloom-auth-checking-title"
            >
                <span className="bloom-auth-checking__icon" aria-hidden="true">
                    <ShieldCheck />
                </span>
                <h1 id="bloom-auth-checking-title">Memeriksa sesi…</h1>
                <p>Konten yang dilindungi belum ditampilkan.</p>
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
        <div className={ `bloom ${isCashierMode ? 'bloom--cashier' : ''} flex w-full min-h-screen` }>
            <Loader />

            { !hideLayout && !isCashierMode && (
                <Sidebar navigationToggleRef={ navigationToggleRef } />
            ) }
            <div className="bloom__content flex-grow flex flex-col">
                { !hideLayout && (
                    <Header
                        cashierMode={ isCashierMode }
                        navigationToggleRef={ navigationToggleRef }
                    />
                ) }

                <div className={ `bloom__content-main ${ contentMainSpacing } flex-grow` }>
                    <Outlet />
                </div>
            </div>
        </div>
    )
}

export default App
