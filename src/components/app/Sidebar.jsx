import {
    BarChart2Icon,
    HelpCircleIcon,
    HospitalIcon,
    LogOutIcon,
    MoonIcon,
    SearchIcon,
    SettingsIcon,
    UsersIcon,
} from "lucide-react";
import { useState } from "react";
import SidebarItem from "./sidebar/SidebarItem.jsx";

export default function Sidebar() {
    const [darkMode, setDarkMode] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);


    const toggleDarkMode = () => {
        document.documentElement.classList.toggle("dark");
        setDarkMode(!darkMode);
    };

    return (
        <aside
            className="transition-all duration-300 ${isExpanded ? 'w-64' : 'w-20'} h-screen bg-gray-100 dark:bg-zinc-900 text-zinc-900 dark:text-white flex flex-col justify-between">
            <div>
                <div className="flex items-center gap-3 px-4 py-6 border-b dark:border-zinc-700">
                    <img
                        src="https://i.pravatar.cc/100"
                        alt="User"
                        className="w-10 h-10 rounded-full"
                    />
                    <div>
                        <div className="font-semibold">John Doe</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">D. in Medicine</div>
                    </div>
                </div>

                { /* Search */ }
                <div className="px-4 py-4">
                    <div className="flex items-center bg-white dark:bg-zinc-800 px-3 py-2 rounded-md shadow-inner">
                        <SearchIcon className="w-4 h-4 text-zinc-400"/>
                        <input
                            type="text"
                            placeholder="Search..."
                            className="ml-2 bg-transparent outline-none text-sm text-zinc-800 dark:text-white placeholder:text-zinc-400"
                        />
                    </div>
                </div>

                { /* Navigation */ }
                <nav className="px-4 space-y-2">
                    <SidebarItem icon={ <UsersIcon/> } label="Patients" isExpanded={ isExpanded } />
                    <SidebarItem icon={ <HospitalIcon/> } label="Hospital" isExpanded={ isExpanded } />
                    <SidebarItem icon={ <BarChart2Icon/> } label="Analytics" isExpanded={ isExpanded } />
                    <SidebarItem icon={ <SettingsIcon/> } label="Settings" isExpanded={ isExpanded } />
                </nav>
            </div>

            { /* Footer */ }
            <div className="px-4 py-4 space-y-2">
                <SidebarItem icon={ <HelpCircleIcon/> } label="Help Center"/>
                <SidebarItem icon={ <LogOutIcon/> } label="Log Out"/>

                { /* Night mode toggle */ }
                <div className="flex items-center justify-between bg-zinc-200 dark:bg-zinc-800 rounded-full px-3 py-2">
                    <div className="flex items-center gap-2">
                        <MoonIcon className="w-4 h-4"/>
                        <span className="text-sm">Nightmode</span>
                    </div>
                    <button
                        onClick={ toggleDarkMode }
                        className={ `w-10 h-5 flex items-center bg-gray-400 rounded-full p-1 transition ${
                            darkMode ? "justify-end bg-blue-500" : "justify-start"
                        }` }
                    >
                        <div className="w-3 h-3 bg-white rounded-full"/>
                    </button>
                </div>
            </div>
        </aside>
    );
}
