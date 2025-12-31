import { Bell, Settings, LogOut } from "lucide-react";

import { useAuthStore } from "@stores/index.js";

export default function Header() {
    const currentUser = useAuthStore(state => state.currentUser);

    const today = new Date();
    const dateOptions = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };

    // We can just use static values if we want to perfectly match screenshots, 
    // but dynamic is better for a real app. 
    // Let's us a fixed date for the "design reference" look if desired, 
    // but current date is safer for an actual running app.
    const dateStr = today.toLocaleDateString("en-US", dateOptions);
    const timeStr = today.toLocaleTimeString("en-US", timeOptions);

    return (
        <header className="h-20 bg-white border-b border-gray-200 px-8 flex justify-between items-center w-full">
            { /* Left: Date & Time */ }
            <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-800">{ dateStr }</span>
                <span className="text-xs text-gray-500 font-medium">{ timeStr }</span>
            </div>

            { /* Right: Actions & User */ }
            <div className="flex items-center gap-6">
                { /* Icons */ }
                <div className="flex items-center gap-4 border-r border-gray-200 pr-6">
                    <button className="bg-maroon-900 hover:bg-maroon-700 transition duration-200 relative">
                        <Bell className="w-5 h-5 text-white/80 hover:text-white" />
                        <span className="absolute top-0 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                    <button className="bg-maroon-900 hover:bg-maroon-700 transition duration-200">
                        <Settings className="w-5 h-5 text-white/80 hover:text-white" />
                    </button>
                    { /* Optional Header Logout */ }
                    <button className="bg-maroon-900 hover:bg-maroon-700 transition duration-200">
                        <LogOut className="w-5 h-5 text-white/80 hover:text-white" />
                    </button>
                </div>

                { /* User Profile */ }
                <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                        <div className="text-sm font-bold text-gray-800">{ currentUser?.name || 'Admin User' }</div>
                        <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase tracking-wider">
                            { currentUser?.role || 'MANAGER' }
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-orange-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                        { /* Use a placeholder image or generic avatar if no user image */ }
                        <img
                            src={ `https://ui-avatars.com/api/?name=${currentUser?.name || 'Admin'}&background=random&color=fff` }
                            alt="User"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </div>
        </header>
    )
}