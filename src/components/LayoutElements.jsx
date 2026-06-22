import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { getAdminDashboardApi } from '../Action/api';
import {
  LayoutDashboard, Users, ShoppingCart, Settings,
  LogOut, Menu, Moon, Sun, Search, Bell, Package, X, Truck, ClipboardList, Zap, Navigation, Building
} from 'lucide-react';
import logo from '../assets/AmbigaaSilks_logo.png';
import smtLogo from '../assets/SMT_logo.png';

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
  const [badgeCounts, setBadgeCounts] = useState({ buyers: 0, pendingOrders: 0, pendingRequests: 0, pendingDispatches: 0 });

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await getAdminDashboardApi();
        if (res.data?.success) {
          setBadgeCounts({
            buyers: res.data.data.kpi.totalBuyers || 0,
            pendingOrders: res.data.data.kpi.pendingOrders || 0,
            pendingRequests: res.data.data.kpi.pendingRequests || 0,
            pendingDispatches: res.data.data.kpi.pendingDispatches || 0,
          });
        }
      } catch (error) {
        console.error("Failed to fetch sidebar badges", error);
      }
    };
    fetchBadges();

    window.addEventListener('ordersUpdated', fetchBadges);
    window.addEventListener('productRequestsUpdated', fetchBadges);
    window.addEventListener('dispatchesUpdated', fetchBadges);
    return () => {
      window.removeEventListener('ordersUpdated', fetchBadges);
      window.removeEventListener('productRequestsUpdated', fetchBadges);
      window.removeEventListener('dispatchesUpdated', fetchBadges);
    };
  }, []);

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
        { icon: Building, label: 'Companies', to: '/admin/companies' },
        { icon: Users, label: 'Firms & Buyers', to: '/admin/buyers', badge: badgeCounts.buyers > 0 ? badgeCounts.buyers : null },
        { icon: Truck, label: 'Dispatches', to: '/admin/dispatches', badge: badgeCounts.pendingDispatches > 0 ? badgeCounts.pendingDispatches : null },
        { icon: Navigation, label: 'Transporters', to: '/admin/transporters' },
      ]
    },
    {
      title: 'COMMERCE',
      items: [
        { icon: Package, label: 'Designs', to: '/admin/designs' },
        { icon: ShoppingCart, label: 'Orders', to: '/admin/orders', badge: badgeCounts.pendingOrders > 0 ? badgeCounts.pendingOrders : null },
        { icon: Zap, label: 'Product Requests', to: '/admin/requests', badge: badgeCounts.pendingRequests > 0 ? badgeCounts.pendingRequests : null },
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
        {!collapsed && <div className="flex h-18 items-center justify-between px-6 py-2 shrink-0">
          <div className="flex items-center overflow-hidden">
            <div className="logo-flip-container h-20 w-20 shrink-0 mr-2">
              <div className="logo-flip-wrapper">
                <img src={logo} alt="Ambigaa Silks Logo" className="logo-flip-front" />
                <img src={smtLogo} alt="Sri Malakhs Textile Logo" className="logo-flip-back" />
              </div>
            </div>
            <span className="font-bold text-md tracking-tight text-slate-800 dark:text-white whitespace-nowrap">AGS-SMT <br></br>B2B PORTAL</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600 p-1">
            <X size={20} />
          </button>
        </div>}

        {/* Logo Area Collapsed */}
        {collapsed && <div className="flex h-18 items-center justify-center px-0 py-3 shrink-0">
          <div className="flex items-center overflow-hidden">
            <div className="logo-flip-container h-10 w-10 shrink-0">
              <div className="logo-flip-wrapper">
                <img src={logo} alt="Ambigaa Silks Logo" className="logo-flip-front" />
                <img src={smtLogo} alt="Sri Malakhs Textile Logo" className="logo-flip-back" />
              </div>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600 p-1">
            <X size={20} />
          </button>
        </div>
        }

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 sidebar-scroll">
          {sidebarSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!collapsed && (
                <div className="px-2 text-[11px] font-semibold tracking-wider text-[#e2148dc4] mb-2 uppercase">
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

export const Topbar = ({ toggleSidebar, toggleTheme, isDark }) => {
  const { user } = useSelector(state => state.auth);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);
  const notifRef = React.useRef(null);

  useEffect(() => {
    const handleNewNotification = (e) => {
      setNotifications(prev => [e.detail, ...prev]);
    };
    window.addEventListener('newNotification', handleNewNotification);

    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('newNotification', handleNewNotification);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <>
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

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-dark-border transition-colors relative"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#e2148d] rounded-full border-2 border-white dark:border-dark-card shadow-sm"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-dark-card rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-dark-border overflow-hidden z-50 transform origin-top-right transition-all">
                <div className="p-4 border-b border-slate-100 dark:border-dark-border flex items-center justify-between bg-slate-50/80 dark:bg-dark-bg/80 backdrop-blur-sm">
                  <h3 className="font-bold text-slate-800 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs font-semibold text-[#e2148d] hover:text-[#c11078] transition-colors"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-[380px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-dark-bg flex items-center justify-center mb-4 border border-slate-100 dark:border-dark-border">
                        <Bell className="h-8 w-8 opacity-40 text-slate-400" />
                      </div>
                      <p className="font-medium text-slate-600 dark:text-slate-300">No new notifications</p>
                      <p className="text-xs mt-1 text-slate-400">You're all caught up!</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50 dark:divide-dark-border">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-4 transition-colors hover:bg-slate-50/80 dark:hover:bg-dark-bg/50 cursor-pointer ${!notif.read ? 'bg-[#e2148d]/5 dark:bg-[#e2148d]/10' : ''}`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`p-2.5 rounded-full shrink-0 shadow-sm ${!notif.read ? 'bg-[#e2148d] text-white shadow-[#e2148d]/20' : 'bg-slate-100 text-slate-500 dark:bg-dark-bg dark:text-slate-400'}`}>
                              {notif.type?.startsWith('ORDER') ? <ShoppingCart size={18} /> : notif.type?.startsWith('DISPATCH') ? <Truck size={18} /> : <Bell size={18} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold truncate ${!notif.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                {notif.title || 'Notification'}
                              </p>
                              <p className={`text-sm mt-1 leading-snug ${!notif.read ? 'text-slate-600 dark:text-slate-300 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                                {notif.message}
                              </p>
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium flex items-center">
                                {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {!notif.read && (
                              <div className="w-2 h-2 rounded-full bg-[#e2148d] shrink-0 mt-2 shadow-[0_0_8px_rgba(226,20,141,0.6)]"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-slate-100 dark:border-dark-border bg-slate-50/80 dark:bg-dark-bg/80 text-center">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      setShowAllModal(true);
                    }}
                    className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-[#e2148d] transition-colors"
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-center h-8 w-8 rounded-full overflow-hidden border border-slate-200 ml-2 cursor-pointer shadow-sm bg-[#e2148d] text-white text-sm font-bold uppercase shrink-0">
            {user?.profileImage ? (
              <img src={user.profileImage.startsWith('http') ? user.profileImage : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${user.profileImage.startsWith('/') ? '' : '/'}${user.profileImage}`} alt="Profile" className="w-full h-full object-cover bg-white" />
            ) : (
              user?.name ? user.name.charAt(0) : user?.firmName ? user.firmName.charAt(0) : user?.email ? user.email.charAt(0) : 'U'
            )}
          </div>
        </div>
      </header>

      {/* View All Notifications Modal */}
      {showAllModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-card w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#e2148d]/10 text-[#e2148d] rounded-xl">
                  <Bell size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-white">All Notifications</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Your recent updates and alerts</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm font-semibold text-[#e2148d] hover:text-[#c11078] transition-colors"
                  >
                    Mark all as read
                  </button>
                )}
                <button
                  onClick={() => setShowAllModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-border rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {notifications.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-dark-bg flex items-center justify-center mb-4 border border-slate-100 dark:border-dark-border">
                    <Bell className="h-10 w-10 opacity-30 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">No notifications yet</h3>
                  <p className="text-slate-500 dark:text-slate-400">When you receive notifications, they will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 sm:p-3 rounded-xl border transition-all ${!notif.read ? 'border-[#e2148d]/30 bg-[#e2148d]/5 shadow-sm' : 'border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card hover:border-slate-200 dark:hover:border-slate-700'}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl shrink-0 ${!notif.read ? 'bg-[#e2148d] text-white shadow-md shadow-[#e2148d]/20' : 'bg-slate-100 text-slate-500 dark:bg-dark-bg dark:text-slate-400'}`}>
                          {notif.type?.startsWith('ORDER') ? <ShoppingCart size={20} /> : notif.type?.startsWith('DISPATCH') ? <Truck size={20} /> : <Bell size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-4 mb-1">
                            <p className={`font-semibold truncate ${!notif.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                              {notif.title || 'Notification'}
                            </p>
                            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                              {new Date(notif.timestamp).toLocaleDateString()} • {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className={`text-sm leading-relaxed ${!notif.read ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                            {notif.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
