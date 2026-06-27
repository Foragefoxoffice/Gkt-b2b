import React, { useEffect, useState } from 'react';
import {
  Package, CheckCircle, TrendingUp, TrendingDown,
  ShoppingBag, ChevronRight,
  RefreshCcw,
  MoreHorizontal,
  Tag, ShoppingCart, Settings, HelpCircle, Zap
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import { getBuyerDashboardApi } from '../Action/api';
import toast from 'react-hot-toast';

const Sparkline = ({ color, data }) => (
  <div className="h-10 w-24">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`color${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#color${color.replace('#', '')})`} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

const KPICard = ({ title, value, trend, isPositive, sparklineData, color }) => (
  <div className="card p-5 hover:shadow-md transition-shadow relative overflow-hidden group border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card rounded-xl">
    <div className="flex justify-between items-start mb-2">
      <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</h3>
      <div className="p-1.5 bg-slate-50 dark:bg-dark-border rounded text-slate-400">
        <MoreHorizontal size={14} />
      </div>
    </div>
    <div className="flex items-end justify-between">
      <div>
        <p className="text-3xl font-semibold text-slate-800 dark:text-white">{value}</p>
        <div className="flex items-center mt-2 text-xs font-medium">
          {isPositive ? (
            <span className="text-emerald-500 flex items-center bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
              <TrendingUp size={12} className="mr-1" /> {trend}
            </span>
          ) : (
            <span className="text-rose-500 flex items-center bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded">
              <TrendingDown size={12} className="mr-1" /> {trend}
            </span>
          )}
          <span className="text-slate-400 ml-2">vs last month</span>
        </div>
      </div>
      <div className="opacity-80 group-hover:opacity-100 transition-opacity">
        <Sparkline color={color} data={sparklineData} />
      </div>
    </div>
  </div>
);

const QuickActionCard = ({ icon: Icon, title, onClick, colorClass, bgClass }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center p-3 rounded-[20px] hover:bg-white dark:hover:bg-dark-card transition-all duration-300 border border-transparent group h-full"
  >
    <div className={`p-3.5 rounded-[14px] mb-4 ${bgClass}`}>
      <Icon className={`${colorClass} group-hover:scale-110 transition-transform duration-300`} size={26} strokeWidth={2} />
    </div>
    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 text-center leading-snug px-1">
      {title}
    </span>
  </button>
);

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const getImageUrl = (path) => {
    if (!path) return '';
    const cleanPath = path.replace(/\\/g, '/');
    return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await getBuyerDashboardApi();
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        toast.error('Failed to fetch dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="space-y-2 mb-6">
          <div className="h-8 bg-slate-200 dark:bg-dark-border rounded w-64"></div>
          <div className="h-4 bg-slate-200 dark:bg-dark-border rounded w-48"></div>
        </div>

        {/* KPI Cards Row Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-5 h-24 bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-slate-100 dark:border-dark-border flex items-center">
              <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-dark-border mr-4"></div>
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-slate-200 dark:bg-dark-border rounded w-20"></div>
                <div className="h-6 bg-slate-200 dark:bg-dark-border rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { summary, recentOrders, categories = [], creditSummary = { limit: 1000000, used: 0, pending: 0, available: 1000000 }, charts = {} } = data;

  const sparkline1 = [{ value: 40 }, { value: 30 }, { value: 45 }, { value: 50 }, { value: 35 }, { value: 60 }, { value: 70 }];
  const sparkline2 = [{ value: 20 }, { value: 30 }, { value: 25 }, { value: 40 }, { value: 60 }, { value: 50 }, { value: 80 }];
  const sparkline4 = [{ value: 30 }, { value: 50 }, { value: 40 }, { value: 60 }, { value: 55 }, { value: 70 }, { value: 90 }];

  const getStatusColorInfo = (status) => {
    switch (status) {
      case 'PENDING': return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Pending' };
      case 'APPROVED': return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'In Progress' };
      case 'PROCESSING': return { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400', label: 'Processing' };
      case 'COMPLETED': return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', label: 'Delivered' }; // or Completed
      case 'CANCELLED': return { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-400', label: 'Cancelled' };
      default: return { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', label: status };
    }
  };

  // Get dynamic total spent from API summary
  const totalSpent = summary?.totalSpent || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-white flex items-center">
          Welcome back, Buyer <span className="ml-2 text-2xl wave">👋</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Here's what's happening with your account today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Orders"
          value={summary.totalOrders || 0}
          trend="+18.5%"
          isPositive={true}
          sparklineData={sparkline1}
          color="#10b981"
        />
        <KPICard
          title="Orders in Progress"
          value={summary.approved || summary.pending || 0}
          trend="+12.3%"
          isPositive={true}
          sparklineData={sparkline4}
          color="#0ea5e9"
        />
        <KPICard
          title="Completed Orders"
          value={summary.completed || 0}
          trend="+22.1%"
          isPositive={true}
          sparklineData={sparkline1}
          color="#10b981"
        />
        <KPICard
          title="Total Spent"
          value={`₹${totalSpent.toLocaleString('en-IN')}`}
          trend="+16.4%"
          isPositive={true}
          sparklineData={sparkline2}
          color="#e2148d"
        />
      </div>

      {/* Main Grid: Recent Orders, Quick Actions, Credit Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Recent Orders (7 cols) */}
        <div className="lg:col-span-7 card p-6 border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center"><RefreshCcw className="mr-2 text-primary-600 dark:text-primary-400" />Recent Orders</h2>
            <Link to="/buyer/orders" className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">View All</Link>
          </div>

          <div className="space-y-4">
            {recentOrders && recentOrders.length > 0 ? (
              recentOrders.map(order => {
                const statusInfo = getStatusColorInfo(order.status);
                // Try to get image from first item
                const firstItemImg = order.items && order.items[0]?.design?.image
                  ? getImageUrl(order.items[0].design.image.split(',')[0].trim())
                  : 'https://images.unsplash.com/photo-1610189013658-9a8494c25fce?auto=format&fit=crop&q=80&w=150&h=150'; // fallback

                return (
                  <div key={order.id} onClick={() => navigate('/buyer/orders', { state: { orderId: order.id } })} className="flex flex-wrap sm:flex-nowrap items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors group cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-800 gap-4 sm:gap-2">
                    <div className="flex items-center w-full sm:w-auto flex-1">
                      <img src={firstItemImg} alt="Order item" className="w-14 h-14 rounded-lg object-cover bg-slate-100 border border-slate-200 dark:border-slate-700 flex-shrink-0" />
                      <div className="ml-4 truncate">
                        <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{order.orderNumber}</p>
                        <p className="text-xs text-slate-500 mt-1">{new Date(order.orderDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center min-w-[90px]">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusInfo.bg} ${statusInfo.text}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="text-right flex flex-col items-end min-w-[80px]">
                      <p className="font-bold text-sm text-slate-800 dark:text-white whitespace-nowrap">₹ {order.grandTotal.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-slate-500 mt-1">{order.items?.length || 0} items</p>
                    </div>

                    <ChevronRight size={18} className="text-slate-400 group-hover:text-primary-500 ml-2 hidden sm:block" />
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-slate-50/50 dark:bg-dark-bg/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="h-16 w-16 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500">
                  <ShoppingBag size={32} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">No orders yet</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mb-6">You haven't placed any orders recently. Start exploring our latest collections.</p>
                <button onClick={() => navigate('/buyer/designs')} className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-lg shadow-sm shadow-primary-500/30 transition-all flex items-center">
                  Browse Products
                  <ChevronRight size={16} className="ml-1.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Actions & Credit Summary (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">

          {/* Quick Actions */}
          <div className="card p-6 border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card rounded-2xl shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center">
              <Zap className="mr-2 text-amber-700 dark:text-amber-500" size={22} strokeWidth={2.5} />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <QuickActionCard
                icon={ShoppingBag}
                title="Designs Gallery"
                onClick={() => navigate('/buyer/designs')}
                colorClass="text-amber-700 dark:text-amber-400"
                bgClass="bg-amber-100/60 dark:bg-amber-900/30"
              />
              <QuickActionCard
                icon={Tag}
                title="All Products"
                onClick={() => navigate('/buyer/products')}
                colorClass="text-pink-600 dark:text-pink-400"
                bgClass="bg-pink-100/60 dark:bg-pink-900/30"
              />
              <QuickActionCard
                icon={ShoppingCart}
                title="My Cart"
                onClick={() => navigate('/buyer/cart')}
                colorClass="text-orange-500 dark:text-orange-400"
                bgClass="bg-orange-100/60 dark:bg-orange-900/30"
              />
              <QuickActionCard
                icon={Package}
                title="My Orders"
                onClick={() => navigate('/buyer/orders')}
                colorClass="text-emerald-500 dark:text-emerald-400"
                bgClass="bg-emerald-100/60 dark:bg-emerald-900/30"
              />
              <QuickActionCard
                icon={Settings}
                title="Settings"
                onClick={() => navigate('/buyer/settings')}
                colorClass="text-blue-500 dark:text-blue-400"
                bgClass="bg-blue-100/60 dark:bg-blue-900/30"
              />
              <QuickActionCard
                icon={HelpCircle}
                title="Support"
                onClick={() => toast.success('Support center coming soon!')}
                colorClass="text-indigo-500 dark:text-indigo-400"
                bgClass="bg-indigo-100/60 dark:bg-indigo-900/30"
              />
            </div>
          </div>

          {/* Spent Overview */}
          <div className="card p-6 border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card rounded-2xl shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center">
              <TrendingUp className="mr-2 text-primary-600 dark:text-primary-400" />
              Spent Overview
            </h2>
            <div className="h-64 w-full">
              {charts.monthlyTrends && charts.monthlyTrends.some(d => d.amount > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e2148d" stopOpacity={1} />
                        <stop offset="100%" stopColor="#f0a3cf" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-dark-border" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000) + 'k' : value}`} />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Spent']}
                    />
                    <Bar dataKey="amount" fill="url(#spendGradient)" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <TrendingUp className="mb-2 opacity-20" size={48} />
                  <p>No data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Popular Categories Row */}
      <div className="card p-6 border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card rounded-2xl shadow-sm mt-6 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center"><CheckCircle className='text-primary-600 dark:text-primary-400 mr-2' />Popular Categories</h2>
          <Link to="/buyer/designs" className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">View All</Link>
        </div>

        <div className="flex overflow-x-auto gap-4 pb-4 -mx-2 px-2 snap-x scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {categories.map((cat) => (
            <div key={cat.id} className="w-[180px] shrink-0 cursor-pointer group snap-start" onClick={() => navigate('/buyer/designs')}>
              <div className="w-full aspect-square rounded-xl overflow-hidden mb-3 bg-slate-100">
                <img
                  src={cat.image?.startsWith('http') ? cat.image : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${cat.image?.startsWith('/') ? '' : '/'}${cat.image}`}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1583391733958-d15ce69c8c19?auto=format&fit=crop&q=80&w=200&h=200'; }}
                />
              </div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-white group-hover:text-primary-600 transition-colors">{cat.name}</h3>
              <p className="text-xs font-medium text-slate-500">{cat.count} Designs</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default BuyerDashboard;
