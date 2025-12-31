import { Link, useLocation } from "react-router-dom";

import {
    LayoutDashboard,
    PackageSearch,
    Tags,
    Truck,
    ClipboardCheck,
    ReceiptText,
    HandCoins,
    LogOut,
    Store,
    ChevronLeft,
    ChevronRight,
    User
} from "lucide-react";

import { useAppStore, useAuthStore } from "@stores/index.js";

export default function Sidebar() {
    const isExpanded = useAppStore(state => state.isExpanded);
    const toggleExpand = useAppStore(state => state.toggleExpand);
    const doLogout = useAuthStore(state => state.doLogout);
    const location = useLocation();

    const navItems = [
        { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
        { label: 'Data Barang', icon: PackageSearch, to: '/items' },
        { label: 'Kategori', icon: Tags, to: '/item-categories' },
        { label: 'Penerimaan Barang', icon: Truck, to: '/stock-in' },
        { label: 'Penyesuaian Stok', icon: ClipboardCheck, to: '/stock-adjustment' },
        { label: 'Riwayat Penjualan', icon: ReceiptText, to: '/sales' },
    ];

    const bottomItems = [
        { label: 'Cashier', icon: HandCoins, to: '/cashier' },
    ];

    const handleLogout = async () => {
        await doLogout();
    };

    return (
        <aside
            className={ `
                h-screen sticky top-0
                bg-maroon-900 text-white 
                flex flex-col justify-between 
                border-r border-maroon-800 
                transition-all duration-300
                ${isExpanded ? 'w-64' : 'w-20'}
            ` }
        >
            <div>
                { /* Branding & Toggle */ }
                <div className={ `flex items-center ${isExpanded ? 'px-6 justify-between' : 'justify-center'} h-20 mb-2 relative` }>
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2 rounded-lg">
                            <Store className="w-6 h-6 text-white" />
                        </div>
                        { isExpanded && <span className="font-bold text-xl tracking-wide transition-opacity duration-300">Bloom</span> }
                    </div>

                    { /* Collapse Button - Positioned absolutely if collapsed to save space or inline if expanded */ }
                    <button
                        onClick={ toggleExpand }
                        className={ `
                            hover:bg-white/10 p-1.5 rounded-lg transition-colors
                            ${!isExpanded ? 'absolute -right-3 top-6 bg-maroon-800 border border-maroon-700 shadow-md z-50 rounded-full' : ''}
                        ` }
                    >
                        { isExpanded ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-4 h-4" /> }
                    </button>
                </div>

                { /* Navigation */ }
                <nav className="px-3 space-y-2 overflow-y-auto max-h-[calc(100vh-200px)] custom-scrollbar">
                    { navItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.to);
                        return (
                            <Link
                                key={ item.to }
                                to={ item.to }
                                title={ !isExpanded ? item.label : '' }
                                className={ `
                                    flex items-center gap-3 py-3 rounded-lg transition-all duration-200 group
                                    ${isExpanded ? 'px-4' : 'justify-center px-2'}
                                    ${isActive
                                        ? 'bg-white text-maroon-900 shadow-lg font-bold'
                                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                                    }
                                ` }
                            >
                                <item.icon
                                    className={ `
                                        shrink-0
                                        ${isExpanded ? 'w-5 h-5' : 'w-6 h-6'}
                                        ${isActive ? 'text-maroon-900' : 'text-white/80 group-hover:text-white'}
                                    ` }
                                />
                                { isExpanded && (
                                    <span className="text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300">
                                        { item.label }
                                    </span>
                                ) }
                            </Link>
                        );
                    }) }
                </nav>
            </div>

            { /* Footer */ }
            <div className={ `px-3 py-6 space-y-2 bg-maroon-900` }>
                { bottomItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.to);
                    return (
                        <Link
                            key={ item.to }
                            to={ item.to }
                            title={ !isExpanded ? item.label : '' }
                            className={ `
                                flex items-center gap-3 py-3 rounded-lg transition-all duration-200 group
                                ${isExpanded ? 'px-4' : 'justify-center px-2'}
                                ${isActive
                                    ? 'bg-white text-maroon-900 shadow-lg font-bold'
                                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                                }
                            ` }
                        >
                            <item.icon className={ `shrink-0 ${isExpanded ? 'w-5 h-5' : 'w-6 h-6'}` } />
                            { isExpanded && <span className="text-sm font-medium">{ item.label }</span> }
                        </Link>
                    )
                }) }

                <button
                    onClick={ handleLogout }
                    title={ !isExpanded ? 'Logout' : '' }
                    className={ `
                        w-full flex items-center gap-3 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200 group
                        ${isExpanded ? 'px-4' : 'justify-center px-2'}
                    ` }
                >
                    <LogOut className={ `shrink-0 ${isExpanded ? 'w-5 h-5' : 'w-6 h-6'}` } />
                    { isExpanded && <span className="text-sm font-medium">Logout</span> }
                </button>
            </div>
        </aside>
    );
}
