import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import {
  LayoutDashboard, ShoppingCart, Clock,
  LogOut, X, Package, Zap
} from 'lucide-react';
import { Topbar, SidebarItem } from '../components/LayoutElements';

const BuyerSidebar = ({ collapsed, mobileOpen, setMobileOpen }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const sidebarSections = [
    {
      title: 'OVERVIEW',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', to: '/buyer/dashboard' },
      ]
    },
    {
      title: 'COMMERCE',
      items: [
        { icon: Package, label: 'Designs Gallery', to: '/buyer/designs' },
        { icon: ShoppingCart, label: 'Cart', to: '/buyer/cart' },
      ]
    },
    {
      title: 'HISTORY',
      items: [
        { icon: Clock, label: 'Order History', to: '/buyer/orders' },
      ]
    }
  ];

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden transition-all" onClick={() => setMobileOpen(false)} />
      )}
      <div className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-dark-card border-r border-slate-100 dark:border-dark-border transition-all duration-300 flex flex-col ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'md:w-20' : 'w-64'}`}>

        {/* Logo Area */}
        <div className="flex h-16 items-center justify-between px-6 shrink-0">
          <div className="flex items-center overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-primary-500/20">
              <Zap size={18} fill="currentColor" />
            </div>
            {!collapsed && <span className="ml-3 font-bold text-lg tracking-tight text-slate-800 dark:text-white whitespace-nowrap">Buyer Portal</span>}
          </div>
          <button onClick={() => setMobileOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600 p-1"><X size={20} /></button>
        </div>

        {/* User Profile Summary */}
        {!collapsed && (
          <div className="px-6 py-4 border-b border-slate-100 dark:border-dark-border">
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex -space-x-2">
                <img className="w-8 h-8 rounded-full border-2 border-white dark:border-dark-card" src="https://i.pravatar.cc/150?img=32" alt="Avatar" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                Active Firm Account
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 sidebar-scroll">
          {sidebarSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!collapsed && (
                <div className="px-2 text-[11px] font-bold tracking-wider text-slate-400 mb-2 uppercase">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => (
                <SidebarItem
                  key={item.to}
                  icon={item.icon}
                  label={item.label}
                  to={item.to}
                  badge={item.badge}
                  collapsed={collapsed}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Footer Area */}
        <div className="p-4 border-t border-slate-100 dark:border-dark-border shrink-0">
          <button onClick={handleLogout} className="flex items-center p-2.5 w-full rounded-lg text-red-600 bg-red-50 dark:bg-red-900/20 transition-all group" title={collapsed ? "Logout" : ""}>
            <LogOut size={18} className="min-w-[18px] group-hover:text-red-600" />
            {!collapsed && <span className="ml-3 text-sm font-medium whitespace-nowrap">Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
};

const BuyerLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const toggleSidebar = () => {
    if (window.innerWidth < 768) setMobileOpen(!mobileOpen);
    else setCollapsed(!collapsed);
  };

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg transition-colors duration-200">
      <BuyerSidebar collapsed={collapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className={`transition-all duration-300 ${collapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <Topbar toggleSidebar={toggleSidebar} toggleTheme={toggleTheme} isDark={isDark} />
        <main className="p-6 page-enter-active">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default BuyerLayout;
