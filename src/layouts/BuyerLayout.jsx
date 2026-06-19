import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import {
  LayoutDashboard, ShoppingCart, Clock,
  LogOut, X, Package, Zap, Tag
} from 'lucide-react';
import { Topbar, SidebarItem } from '../components/LayoutElements';
import { getCartApi, getOrdersApi } from '../Action/api';
import { useSocketNotification } from '../hooks/useSocketNotification.jsx';
import logo from '../assets/AmbigaaSilks_logo.png';

const BuyerSidebar = ({ collapsed, mobileOpen, setMobileOpen }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const [cartCount, setCartCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        const res = await getCartApi();
        if (res.data?.success && res.data.data.cart?.items) {
          setCartCount(res.data.data.cart.items.length);
        } else {
          setCartCount(0);
        }
      } catch (error) {
        console.error("Failed to fetch cart count", error);
      }
    };
    const fetchOrderCount = async () => {
      try {
        const res = await getOrdersApi();
        if (res.data?.success && res.data.data) {
          const pendingOrders = res.data.data.filter(o => o.status === 'PENDING');
          setOrderCount(pendingOrders.length);
        } else {
          setOrderCount(0);
        }
      } catch (error) {
        console.error("Failed to fetch order count", error);
      }
    };
    
    fetchCartCount();
    fetchOrderCount();
    
    window.addEventListener('cartUpdated', fetchCartCount);
    window.addEventListener('ordersUpdated', fetchOrderCount);
    return () => {
      window.removeEventListener('cartUpdated', fetchCartCount);
      window.removeEventListener('ordersUpdated', fetchOrderCount);
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
        { icon: LayoutDashboard, label: 'Dashboard', to: '/buyer/dashboard' },
      ]
    },
    {
      title: 'COMMERCE',
      items: [
        { icon: Package, label: 'Designs Gallery', to: '/buyer/designs' },
        { icon: Tag, label: 'Products', to: '/buyer/products' },
        { icon: ShoppingCart, label: 'Cart', to: '/buyer/cart', badge: cartCount > 0 ? cartCount : null },
      ]
    },
    {
      title: 'HISTORY',
      items: [
        { icon: Clock, label: 'Order History', to: '/buyer/orders', badge: orderCount > 0 ? orderCount : null },
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
        {!collapsed && <div className="flex h-18 items-center justify-between px-6 py-2 shrink-0">
          <div className="flex items-center overflow-hidden">
            {!collapsed && <img src={logo} alt="Logo" className="h-20 w-auto" />}
            {collapsed && <img src={logo} alt="Logo" className="h-10 w-auto" />}
            {!collapsed && <span className="ml-2 font-bold text-lg tracking-tight text-slate-800 dark:text-white whitespace-nowrap">AMS ERP</span>}
          </div>
          <button onClick={() => setMobileOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600 p-1">
            <X size={20} />
          </button>
        </div>}

        {/* Logo Area Collapsed */}
        {collapsed && <div className="flex h-18 items-center justify-center px-0 py-3 shrink-0">
          <div className="flex items-center overflow-hidden">
            {collapsed && <img src={logo} alt="Logo" className="h-12 w-auto" />}
          </div>
          <button onClick={() => setMobileOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600 p-1">
            <X size={20} />
          </button>
        </div>
        }

        {/* User Profile Summary */}
        {!collapsed && (
          <div className="px-6 py-4 border-b border-slate-100 dark:border-dark-border">
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex -space-x-2 shrink-0">
                {user?.profileImage ? (
                  <img 
                    className="w-10 h-10 rounded-full border-2 border-white dark:border-dark-card object-cover bg-slate-100" 
                    src={user.profileImage.startsWith('http') ? user.profileImage : `http://localhost:5000${user.profileImage.startsWith('/') ? '' : '/'}${user.profileImage}`} 
                    alt="Avatar" 
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full border-2 border-white dark:border-dark-card bg-[#e2148d] text-white flex items-center justify-center text-lg font-bold uppercase shadow-sm">
                    {user?.name ? user.name.charAt(0) : user?.firmName ? user.firmName.charAt(0) : user?.email ? user.email.charAt(0) : 'U'}
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center overflow-hidden">
                <span className="text-sm font-semibold text-slate-800 dark:text-white truncate max-w-[140px]">
                  {user?.name || user?.firmName || 'User'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                  {user?.email}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center text-xs text-slate-600 dark:text-slate-300 font-medium bg-slate-50 dark:bg-dark-bg px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-dark-border">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
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

  useSocketNotification();

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
