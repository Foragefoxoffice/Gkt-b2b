import React, { useEffect, useState } from 'react';
import { ShoppingBag, Clock, CheckCircle, Package } from 'lucide-react';
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
                    <img src={`http://localhost:5000${design.image}`} alt={design.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
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
    </div>
  );
};

export default BuyerDashboard;
