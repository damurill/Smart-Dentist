import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Settings, Menu, X, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const { t, language, toggleLanguage } = useLanguage();

    const navItems = [
        { to: "/", icon: LayoutDashboard, label: t('menu.dashboard') },
        { to: "/calendar", icon: Calendar, label: t('menu.calendar') },
        { to: "/patients", icon: Users, label: t('menu.patients') },
    ];

    return (
        <div className="flex h-screen bg-gray-50 text-slate-900 font-sans overflow-hidden">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-30">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Smart Medical
                </h1>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                    {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-30
                w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-6 border-b border-gray-100 hidden md:block">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Smart Medical
                    </h1>
                </div>

                <div className="md:hidden p-6 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">Menú</span>
                    <button onClick={() => setIsSidebarOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setIsSidebarOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? "bg-blue-50 text-blue-600 font-medium shadow-sm"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100 space-y-2">
                    <button
                        onClick={toggleLanguage}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
                    >
                        <Globe className="w-5 h-5" />
                        <span className="font-medium">{language === 'es' ? 'English' : 'Español'}</span>
                    </button>

                    <NavLink
                        to="/settings"
                        onClick={() => setIsSidebarOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                ? "bg-blue-50 text-blue-600 font-medium shadow-sm"
                                : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                            }`
                        }
                    >
                        <Settings className="w-5 h-5" />
                        <span>{t('menu.settings')}</span>
                    </NavLink>
                </div>
                <div className="p-4 border-t border-gray-100 mt-auto">
                    <button
                        onClick={() => {
                            localStorage.removeItem('isAuthenticated');
                            localStorage.removeItem('token');
                            window.location.href = '/login';
                        }}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        <span className="font-medium">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto pt-16 md:pt-0 w-full relative">
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
