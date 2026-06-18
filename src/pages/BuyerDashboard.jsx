import React, { useEffect, useState } from 'react';
import { ShoppingBag, Clock, CheckCircle, Package, TrendingUp, PieChart as PieChartIcon, BarChart2, Activity } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Link } from 'react-router-dom';
import { getBuyerDashboardApi } from '../Action/api';
import toast from 'react-hot-toast';

const KPICard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="card flex items-center p-5 hover:shadow-md transition-shadow">
    <div className={`p-4 rounded-full mr-4 ${colorClass}`}>
      <Icon size={24} />
    </div>
    <div>
      <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{value}</p>
    </div>
  </div>
);

const BuyerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const getImageUrl = (path) => {
    if (!path) return '';
    const cleanPath = path.replace(/\\/g, '/');
    return `http://localhost:5000${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
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
        <div className="h-8 bg-slate-200 dark:bg-dark-border rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-200 dark:bg-dark-border rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  const { summary, recentOrders, newArrivals } = data;

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'APPROVED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'PROCESSING': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const COLORS = ['#f59e0b', '#3b82f6', '#6366f1', '#10b981', '#ef4444'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Welcome back!</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Here is your account overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Orders" value={summary.totalOrders} icon={ShoppingBag} colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30" />
        <KPICard title="Pending Approval" value={summary.pending} icon={Clock} colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900/30" />
        <KPICard title="In Process" value={summary.approved} icon={Package} colorClass="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30" />
        <KPICard title="Completed" value={summary.completed} icon={CheckCircle} colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Recent Orders</h2>
            <Link to="/buyer/orders" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View All</Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <Package size={48} className="mx-auto mb-3 opacity-50" />
              <p>No recent orders found.</p>
              <Link to="/buyer/designs" className="btn-primary mt-4 inline-block">Browse Designs</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-50 dark:bg-dark-bg text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-tl-lg">Order No</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium rounded-tr-lg">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.id} className="border-b border-slate-100 dark:border-dark-border last:border-0 hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{order.orderNumber}</td>
                      <td className="px-4 py-3">{new Date(order.orderDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">₹{order.grandTotal.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-primary-600 hover:text-primary-800 font-medium text-xs border border-primary-200 dark:border-primary-900 bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors">
                          Reorder
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">New Arrivals</h2>
          <div className="grid grid-cols-2 gap-4">
            {newArrivals.slice(0, 4).map(design => (
              <div key={design.id} className="group cursor-pointer">
                <div className="aspect-square bg-slate-100 dark:bg-dark-bg rounded-lg overflow-hidden mb-2 relative">
                  {design.image ? (
                    <img src={getImageUrl(design.image.split(',')[0].trim())} alt={design.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">No Img</div>
                  )}
                  <div className="absolute top-2 right-2 bg-primary-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">NEW</div>
                </div>
                <h4 className="text-sm font-medium text-slate-800 dark:text-white truncate">{design.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">₹{design.rate}</p>
              </div>
            ))}
          </div>
          <Link to="/buyer/designs" className="block w-full text-center py-2 mt-4 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors border border-slate-200 dark:border-dark-border rounded-lg">
            View All Designs
          </Link>
        </div>
      </div>

      {/* Analytics Charts Section */}
      {data.charts && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chart 1: Order Status Distribution */}
          <div className="card h-96 flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center">
              <PieChartIcon className="mr-2 text-primary-500" size={20} /> Order Status
            </h2>
            <div className="flex-1 min-h-0">
              {data.charts.orderStatusDistribution && data.charts.orderStatusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.charts.orderStatusDistribution}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.charts.orderStatusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip wrapperClassName="dark:bg-dark-card dark:text-white dark:border-dark-border rounded-lg shadow-lg" />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <PieChartIcon className="mb-2 opacity-20" size={48} />
                  <p>No data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Monthly Spend */}
          <div className="card h-96 flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center">
              <BarChart2 className="mr-2 text-primary-500" size={20} /> Monthly Spend (₹)
            </h2>
            <div className="flex-1 min-h-0">
              {data.charts.monthlyTrends && data.charts.monthlyTrends.some(t => t.amount > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.charts.monthlyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `₹${val / 1000}k`} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="amount" fill="#e2148d" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <BarChart2 className="mb-2 opacity-20" size={48} />
                  <p>No data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Chart 3: Monthly Orders Count */}
          <div className="card h-96 flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center">
              <TrendingUp className="mr-2 text-primary-500" size={20} /> Orders Volume
            </h2>
            <div className="flex-1 min-h-0">
              {data.charts.monthlyTrends && data.charts.monthlyTrends.some(t => t.orders > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.charts.monthlyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <TrendingUp className="mb-2 opacity-20" size={48} />
                  <p>No data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Chart 4: Recent Order Values */}
          <div className="card h-96 flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center">
              <Activity className="mr-2 text-primary-500" size={20} /> Recent Orders Value
            </h2>
            <div className="flex-1 min-h-0">
              {data.charts.recentOrderValues && data.charts.recentOrderValues.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.charts.recentOrderValues} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `₹${val / 1000}k`} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="amount" stroke="#10b981" fillOpacity={1} fill="url(#colorAmount)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Activity className="mb-2 opacity-20" size={48} />
                  <p>No data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerDashboard;
