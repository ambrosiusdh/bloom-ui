import { useAppStore, useAuthStore } from "@stores/index.js";
import {
    HandCoinsIcon,
    LogOutIcon,
    UsersIcon,
    UserIcon,
    PackageSearchIcon,
    ReceiptTextIcon, TagsIcon
} from "lucide-react";
import { useState } from "react";
import SidebarItem from "./sidebar/SidebarItem.jsx";

export default function Sidebar() {
    const isExpanded = useAppStore(state => state.isExpanded)
    const currentUser = useAuthStore(state => state.currentUser)
    const doLogout = useAuthStore(state => state.doLogout)

    const [darkMode, setDarkMode] = useState(false);


    const toggleDarkMode = () => {
        document.documentElement.classList.toggle("dark");
        setDarkMode(!darkMode);
    };

    const handleLogout = async () => {
        await doLogout();
    }

    return (
        <aside
            className=
                { `transition-all duration-300 ${isExpanded ? 'w-64' : 'w-20'} 
                min-h-screen 
                bg-maroon-600
                text-white
                flex 
                flex-col 
                justify-between 
                border-r 
                border-gray-300` }
        >
            <div>
                <div className="flex items-center gap-3 px-4 h-16 border-b mb-4 pb-2">
                    <UserIcon
                        alt="User"
                        className="w-10 h-10 rounded-full"
                    />

                    {
                        isExpanded && (
                        <div>
                            <div className="font-semibold">{ currentUser?.name }</div>
                            <div className="text-xs">{ currentUser?.role }</div>
                        </div>
                        )
                    }
                </div>

                { /* Navigation */ }
                <nav className="px-4 space-y-2">
                    <SidebarItem
                        to="/dashboard"
                        icon={ UsersIcon }
                        label="Dashboard"
                        isExpanded={ isExpanded }
                    />

                    <SidebarItem
                        to="/items"
                        icon={ PackageSearchIcon }
                        label="Data Barang"
                        isExpanded={ isExpanded }/>

                    <SidebarItem
                        to="/item-categories"
                        icon={ TagsIcon }
                        label="Kategori Barang"
                        isExpanded={ isExpanded }/>

                    <SidebarItem
                        to="/sales"
                        icon={ ReceiptTextIcon }
                        label="Riwayat Penjualan"
                        isExpanded={ isExpanded }/>
                </nav>
            </div>

            { /* Footer */ }
            <div className="px-4 py-4 space-y-2">
                <SidebarItem
                    to="/cashier"
                    icon={ HandCoinsIcon }
                    label="Cashier"
                    isExpanded={ isExpanded }/>

                <SidebarItem
                    onClick={ handleLogout }
                    icon={ LogOutIcon }
                    label="Logout"
                    isExpanded={ isExpanded }/>

                { /* TODO: Night mode toggle */ }
                { /*<div className="flex items-center justify-between bg-zinc-200 dark:bg-zinc-800 rounded-full px-3 py-2">*/ }
                { /*    <div*/ }
                { /*        onClick={ toggleDarkMode }*/ }
                { /*        className="flex items-center gap-2 cursor-pointer">*/ }
                { /*        <MoonIcon className="w-4 h-4"/>*/ }
                { /*        { isExpanded && <span className="text-sm">Nightmode</span> }*/ }
                { /*    </div>*/ }
                { /*    <button*/ }
                { /*        onClick={ toggleDarkMode }*/ }
                { /*        className={ `w-10 h-5 flex items-center bg-gray-400 rounded-full p-1 transition ${*/ }
                { /*            darkMode ? "justify-end bg-blue-500" : "justify-start"*/ }
                { /*        }` }*/ }
                { /*    >*/ }
                { /*        <div className="w-3 h-3 bg-white rounded-full"/>*/ }
                { /*    </button>*/ }
                { /*</div>*/ }
            </div>
        </aside>
    );
}
