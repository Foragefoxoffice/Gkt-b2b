import React, { useEffect, useState, useRef } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Package, MoreHorizontal, Calendar, Download,
  Users, Truck, Layers, Star, AlertTriangle, X
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import toast from 'react-hot-toast';
import { getAdminDashboardApi } from '../Action/api';

const Sparkline = ({ color, data }) => (
  <div className="h-10 w-24">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`color${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#color${color})`} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

const KPICard = ({ title, value, trend, isPositive, sparklineData, color }) => (
  <div className="card p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
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

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const alertedItems = useRef(new Set());

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await getAdminDashboardApi();
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (data && data.kpi && data.kpi.criticalStockItems) {
      data.kpi.criticalStockItems.forEach(d => {
        if (!alertedItems.current.has(d.id)) {
          toast.custom((t) => (
            <div
              className={`${t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-md w-full bg-white dark:bg-dark-card shadow-2xl rounded-2xl border-2 border-red-500 pointer-events-auto flex overflow-hidden`}
            >
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shadow-inner">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-md font-black text-red-700 dark:text-red-400">
                      Critical Stock Alert
                    </p>
                    <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                      Product <span className="font-bold text-slate-800 dark:text-white">{d.name} ({d.code})</span> is almost out of stock! Only <span className="font-black text-red-600 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded">{d.availableStock} units</span> left.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-dark-bg">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          ), {
            duration: 8000,
            position: 'top-right',
            id: `low-stock-dash-${d.id}`
          });
          alertedItems.current.add(d.id);
        }
      });
    }
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-dark-border rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 dark:bg-dark-border rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  const { kpi, charts } = data;

  // Dummy sparkline data for aesthetics
  const sparkline1 = [{ value: 40 }, { value: 30 }, { value: 45 }, { value: 50 }, { value: 35 }, { value: 60 }, { value: 70 }];
  const sparkline2 = [{ value: 20 }, { value: 30 }, { value: 25 }, { value: 40 }, { value: 60 }, { value: 50 }, { value: 80 }];
  const sparkline3 = [{ value: 70 }, { value: 60 }, { value: 50 }, { value: 40 }, { value: 55 }, { value: 45 }, { value: 30 }];
  const sparkline4 = [{ value: 30 }, { value: 50 }, { value: 40 }, { value: 60 }, { value: 55 }, { value: 70 }, { value: 90 }];

  const PIE_COLORS = ['#e2148d', '#f0a3cf', '#fcd34d', '#34d399', '#f87171'];

  return (
    <div className="space-y-6">
      {/* Header aligned with the image aesthetic */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
            Dashboard Overview <span className="ml-2 text-xl">👋</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Here are the latest insights across your active operations.</p>
        </div>
        {/* <div className="flex items-center space-x-3">
          <button className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-all dark:bg-dark-card dark:text-slate-300 dark:border-dark-border dark:hover:bg-dark-border">
            <Calendar size={16} className="mr-2" /> Schedule Report
          </button>
          <button className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-500 shadow-sm shadow-primary-500/30 transition-all">
            <Download size={16} className="mr-2" /> Export Report
          </button>
        </div> */}
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Orders"
          value={kpi.totalOrders}
          trend="+12.5%"
          isPositive={true}
          sparklineData={sparkline1}
          color="#10b981"
        />
        <KPICard
          title="Total Sales Value"
          value={`₹${kpi.totalSales >= 1000000 ? (kpi.totalSales / 1000000).toFixed(1) + 'M' : kpi.totalSales.toLocaleString()}`}
          trend="+8.2%"
          isPositive={true}
          sparklineData={sparkline2}
          color="#e2148d"
        />
        <KPICard
          title="Pending Orders"
          value={kpi.pendingOrders}
          trend="-4.2%"
          isPositive={false}
          sparklineData={sparkline3}
          color="#f43f5e"
        />
        <KPICard
          title="Total Buyers"
          value={kpi.totalBuyers}
          trend="+3.1%"
          isPositive={true}
          sparklineData={sparkline4}
          color="#0ea5e9"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2 relative">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-md font-semibold text-slate-800 dark:text-white flex items-center">
              <TrendingUp size={16} className="mr-2 text-primary-500" /> Order Status Distribution
            </h2>
            <div className="flex items-center space-x-2 text-xs font-medium">
              <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-primary-200 mr-2"></div> Draft</span>
              <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-primary-500 mr-2"></div> Finalized</span>
            </div>
          </div>
          <div className="h-80 w-full flex items-center justify-center">
            {charts.orderStatusDistribution && charts.orderStatusDistribution.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.orderStatusDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e2148d" stopOpacity={1} />
                      <stop offset="100%" stopColor="#f0a3cf" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-dark-border" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="value" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={40} />
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

        {/* Side Panel matching the "Gross Profit by Project" aesthetic */}
        <div className="card flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-md font-semibold text-slate-800 dark:text-white flex items-center">
              <DollarSign size={16} className="mr-2 text-primary-500" /> Sales Overview
            </h2>
            <select className="bg-slate-50 dark:bg-dark-bg border-none text-xs font-medium text-slate-600 dark:text-slate-300 rounded outline-none py-1 px-2 cursor-pointer">
              <option>This Month</option>
              <option>Last Month</option>
            </select>
          </div>

          <div className="mb-6">
            <p className="text-3xl font-semibold text-slate-800 dark:text-white">₹{kpi.monthlySales.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">Total sales (this month)</p>
          </div>

          <div className="flex-1">
            <p className="text-xs font-bold text-slate-800 dark:text-white mb-3">Status Breakdown</p>
            <div className="space-y-4">
              {charts.orderStatusDistribution.filter(d => d.value > 0).map((entry, index) => (
                <div key={entry.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-600 dark:text-slate-300 flex items-center">
                      <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></span>
                      {entry.name}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-white">{entry.value}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-dark-bg rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${(entry.value / kpi.totalOrders) * 100}%`,
                        backgroundColor: PIE_COLORS[index % PIE_COLORS.length]
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-slate-100 dark:border-dark-border grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-white">₹{kpi.totalSales >= 1000000 ? (kpi.totalSales / 1000000).toFixed(1) + 'M' : kpi.totalSales.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Total Sales</p>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-white">{kpi.totalOrders}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Total Orders</p>
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-500">8.1%</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">QoQ Growth</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Charts Row 1: Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="card relative">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-md font-semibold text-slate-800 dark:text-white flex items-center">
              <TrendingUp size={16} className="mr-2 text-primary-500" /> Sales Trend
            </h2>
          </div>
          <div className="h-72 w-full">
            {charts.monthlyTrends && charts.monthlyTrends.some(d => d.sales > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-dark-border" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `₹${v >= 1000 ? v / 1000 + 'k' : v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Sales']}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#salesGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <TrendingUp className="mb-2 opacity-20" size={48} />
                <p>No data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Buyer Growth */}
        <div className="card relative">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-md font-semibold text-slate-800 dark:text-white flex items-center">
              <Users size={16} className="mr-2 text-primary-500" /> Buyer Growth
            </h2>
          </div>
          <div className="h-72 w-full">
            {charts.monthlyTrends && charts.monthlyTrends.some(d => d.buyers > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-dark-border" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(value) => [value, 'New Buyers']}
                  />
                  <Line type="monotone" dataKey="buyers" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Users className="mb-2 opacity-20" size={48} />
                <p>No data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Charts Row 2: Inventory & Dispatch */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dispatch Status */}
        <div className="card relative">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-md font-semibold text-slate-800 dark:text-white flex items-center">
              <Truck size={16} className="mr-2 text-primary-500" /> Dispatch Status
            </h2>
          </div>
          <div className="h-64 w-full">
            {charts.dispatchStatusDistribution && charts.dispatchStatusDistribution.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.dispatchStatusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {charts.dispatchStatusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Truck className="mb-2 opacity-20" size={48} />
                <p>No data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Selling Designs */}
        <div className="card relative">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-md font-semibold text-slate-800 dark:text-white flex items-center">
              <Star size={16} className="mr-2 text-primary-500" /> Top Selling Designs
            </h2>
          </div>
          <div className="h-64 w-full">
            {charts.topSellingDesigns && charts.topSellingDesigns.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.topSellingDesigns} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" className="dark:stroke-dark-border" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="quantity" fill="#fcd34d" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Star className="mb-2 opacity-20" size={48} />
                <p>No data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Inventory by Category */}
        <div className="card relative">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-md font-semibold text-slate-800 dark:text-white flex items-center">
              <Layers size={16} className="mr-2 text-primary-500" /> Inventory by Category
            </h2>
          </div>
          <div className="h-64 w-full">
            {charts.inventoryByCategory && charts.inventoryByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.inventoryByCategory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-dark-border" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Layers className="mb-2 opacity-20" size={48} />
                <p>No data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
