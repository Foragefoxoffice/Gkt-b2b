import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import {
  LayoutDashboard, Users, ShoppingCart, Settings,
  LogOut, Menu, Moon, Sun, Search, Bell, Package, X, Truck, ClipboardList, Zap
} from 'lucide-react';

export const SidebarItem = ({ icon: Icon, label, to, collapsed, badge }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center justify-between p-2.5 my-0.5 rounded-lg transition-all group ${isActive
        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400 font-semibold shadow-sm'
        : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-dark-border hover:text-slate-900'
      }`
    }
    title={collapsed ? label : ''}
  >
    <div className="flex items-center">
      <Icon size={18} className="min-w-[18px]" strokeWidth={isActive => isActive ? 2.5 : 2} />
      {!collapsed && <span className="ml-3 text-sm">{label}</span>}
    </div>
    {!collapsed && badge && (
      <span className="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
        {badge}
      </span>
    )}
  </NavLink>
);

export const AdminSidebar = ({ collapsed, toggleCollapse, mobileOpen, setMobileOpen }) => {
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
        { icon: LayoutDashboard, label: 'Dashboard', to: '/admin/dashboard' },
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { icon: Users, label: 'Firms & Buyers', to: '/admin/buyers', badge: 5 },
        { icon: Truck, label: 'Dispatches', to: '/admin/dispatches' },
      ]
    },
    {
      title: 'COMMERCE',
      items: [
        { icon: Package, label: 'Designs', to: '/admin/designs' },
        { icon: ShoppingCart, label: 'Orders', to: '/admin/orders', badge: 12 },
        { icon: ClipboardList, label: 'Inventory', to: '/admin/inventory' },
      ]
    },
    {
      title: 'SUPPORT',
      items: [
        { icon: Settings, label: 'Settings', to: '/admin/settings' },
      ]
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden transition-all"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-dark-card border-r border-slate-100 dark:border-dark-border transition-all duration-300 flex flex-col ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'md:w-20' : 'w-64'}`}>

        {/* Logo Area */}
        <div className="flex h-16 items-center justify-between px-6 shrink-0">
          <div className="flex items-center overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-primary-500/20">
              <Zap size={18} fill="currentColor" />
            </div>
            {!collapsed && <span className="ml-3 font-bold text-lg tracking-tight text-slate-800 dark:text-white whitespace-nowrap">GKT ERP</span>}
          </div>
          <button onClick={() => setMobileOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600 p-1">
            <X size={20} />
          </button>
        </div>

        {/* User Profile Summary (like the image) */}
        {!collapsed && (
          <div className="px-6 py-4 border-b border-slate-100 dark:border-dark-border">
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex -space-x-2">
                <img className="w-8 h-8 rounded-full border-2 border-white dark:border-dark-card" src="https://i.pravatar.cc/100?img=1" alt="Avatar" />
                <img className="w-8 h-8 rounded-full border-2 border-white dark:border-dark-card" src="https://i.pravatar.cc/100?img=2" alt="Avatar" />
                <img className="w-8 h-8 rounded-full border-2 border-white dark:border-dark-card" src="https://i.pravatar.cc/100?img=3" alt="Avatar" />
              </div>
              <button className="w-8 h-8 rounded-full border border-slate-200 dark:border-dark-border flex items-center justify-center text-slate-500 hover:bg-slate-50">
                <span className="text-xs font-medium">...</span>
              </button>
            </div>
            <div className="space-y-1">
              <div className="flex items-center text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                Open
              </div>
              <div className="flex items-center text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-primary-500 mr-2"></span>
                Ongoing Engagement
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
          <button
            onClick={handleLogout}
            className="flex items-center p-2.5 w-full rounded-lg text-red-600 bg-red-50 dark:bg-red-900/20 transition-all group"
            title={collapsed ? "Logout" : ""}
          >
            <LogOut size={18} className="min-w-[18px] group-hover:text-red-600" />
            {!collapsed && <span className="ml-3 text-sm font-medium whitespace-nowrap">Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export const Topbar = ({ toggleSidebar, toggleTheme, isDark }) => (
  <header className="h-16 bg-white/80 backdrop-blur-md dark:bg-dark-card/80 border-b border-slate-100 dark:border-dark-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 transition-colors">
    <div className="flex items-center">
      <button onClick={toggleSidebar} className="p-2 mr-4 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-dark-border transition-colors focus:outline-none">
        <Menu size={20} />
      </button>

      {/* Global Search */}
      <div className="hidden md:flex items-center bg-slate-50 hover:bg-slate-100 dark:bg-dark-bg rounded-full px-4 py-2 border border-slate-200 dark:border-dark-border focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-100 focus-within:bg-white transition-all w-80">
        <Search size={16} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search here..."
          className="bg-transparent border-none outline-none ml-2 text-sm text-slate-700 dark:text-slate-300 w-full placeholder:text-slate-400"
        />
        <div className="flex items-center text-[10px] text-slate-400 font-medium px-1.5 py-0.5 rounded border border-slate-200 bg-white ml-2">
          ⌘S
        </div>
      </div>
    </div>

    <div className="flex items-center space-x-3">
      <button onClick={toggleTheme} className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-dark-border transition-colors">
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <button className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-dark-border transition-colors relative">
        <Bell size={18} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-dark-card"></span>
      </button>
      <div className="h-8 w-8 rounded-full overflow-hidden border border-slate-200 ml-2 cursor-pointer shadow-sm">
        <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="w-full h-full object-cover" />
      </div>
    </div>
  </header>
);
