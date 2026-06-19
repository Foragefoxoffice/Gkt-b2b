import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrdersApi, getOrderByIdApi, updateOrderStatusApi } from '../Action/api';
import { useSelector } from 'react-redux';
import { ShoppingCart, Eye, CheckCircle, XCircle, Package, TrendingUp, TrendingDown, MoreHorizontal, Clock, Search, SlidersHorizontal, User, Calendar, Truck, MessageSquare } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { TextField, MenuItem, InputAdornment } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from '../components/ConfirmDialog';
import orderCanceledSound from '../assets/order_canceled.mp3';

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
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
    <div className="flex justify-between items-start mb-2">
      <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</h3>
      <div className="p-1.5 bg-slate-50 dark:bg-dark-border rounded text-slate-400">
        <MoreHorizontal size={14} />
      </div>
    </div>
    <div className="flex items-end justify-between">
      <div>
        <div className="text-2xl font-semibold text-slate-800 dark:text-white">{value}</div>
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
  </motion.div>
);

const AdminOrders = () => {
  const { token } = useSelector(state => state.auth);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [remarks, setRemarks] = useState('');
  const navigate = useNavigate();

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({ open: false, orderId: null, status: '' });

  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('date_desc');

  useEffect(() => {
    fetchOrders();

    // Listen for socket events to refresh list
    window.addEventListener('ordersUpdated', fetchOrders);
    return () => window.removeEventListener('ordersUpdated', fetchOrders);
  }, []);

  const fetchOrders = async () => {
    if (orders.length === 0) setLoading(true);
    try {
      const res = await getOrdersApi();
      setOrders(res.data.data);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = (orderId, newStatus) => {
    setConfirmDialog({ open: true, orderId, status: newStatus });
  };

  const executeUpdateStatus = async () => {
    const { orderId, status: newStatus } = confirmDialog;
    setConfirmDialog({ open: false, orderId: null, status: '' });
    try {
      await updateOrderStatusApi(orderId, { status: newStatus, remarks });
      toast.success(`Order ${newStatus.toLowerCase()} successfully`);
      if (newStatus === 'CANCELLED') {
        const audio = new Audio(orderCanceledSound);
        audio.play().catch(e => console.log('Audio playback failed:', e));
      }
      closeModal();
      setRemarks('');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${newStatus.toLowerCase()} order`);
    }
  };

  const handleViewOrder = async (orderId) => {
    try {
      const res = await getOrderByIdApi(orderId);
      setSelectedOrder(res.data.data);
      setIsModalOpen(true);
      setRemarks('');
    } catch (err) {
      toast.error('Failed to load order details');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedOrder(null), 300);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50';
      case 'APPROVED': return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50';
      case 'PROCESSING': return 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50';
      case 'DISPATCHED': return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50';
      case 'COMPLETED': return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50';
      case 'CANCELLED': return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50';
      default: return 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50';
    }
  };

  const formatPrice = (val) => {
    if (val === undefined || val === null) return '';
    const [intPart, decPart] = val.toString().split('.');
    const formattedInt = intPart.replace(/(\d)(?=(\d\d)+\d$)/g, "$1,");
    return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
  };

  // KPIs
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const totalSales = orders.filter(o => o.status === 'COMPLETED' || o.status === 'APPROVED' || o.status === 'PROCESSING').reduce((acc, curr) => acc + curr.grandTotal, 0);

  // Filtering & Sorting
  const filteredAndSortedOrders = useMemo(() => {
    let result = orders.filter(o => {
      const matchSearch =
        o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.buyer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.buyer?.code?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;

      return matchSearch && matchStatus;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc': return new Date(b.orderDate) - new Date(a.orderDate);
        case 'date_asc': return new Date(a.orderDate) - new Date(b.orderDate);
        case 'amount_desc': return b.grandTotal - a.grandTotal;
        case 'amount_asc': return a.grandTotal - b.grandTotal;
        default: return 0;
      }
    });

    return result;
  }, [orders, searchTerm, statusFilter, sortBy]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
            <ShoppingCart className="mr-3 text-primary-600" /> Order Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">Review, approve, and track all incoming orders from buyers.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
        <KPICard
          title="Total Orders"
          value={totalOrders}
          trend="+12.5%"
          isPositive={true}
          sparklineData={[{ value: 40 }, { value: 30 }, { value: 45 }, { value: 50 }, { value: 35 }, { value: 60 }, { value: 70 }]}
          color="#10b981"
        />
        <KPICard
          title="Action Required"
          value={pendingOrders}
          trend="-4.2%"
          isPositive={false}
          sparklineData={[{ value: 70 }, { value: 60 }, { value: 50 }, { value: 40 }, { value: 55 }, { value: 45 }, { value: 30 }]}
          color="#f43f5e"
        />
        <KPICard
          title="Total Sales"
          value={`₹${formatPrice(totalSales.toFixed(0))}`}
          trend="+8.2%"
          isPositive={true}
          sparklineData={[{ value: 20 }, { value: 30 }, { value: 25 }, { value: 40 }, { value: 60 }, { value: 50 }, { value: 80 }]}
          color="#e2148d"
        />
      </div>

      {/* Advanced Filters */}
      <div className="bg-white dark:bg-dark-card p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-dark-border">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center mb-6">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-medium">
            <SlidersHorizontal size={18} className="text-primary-600" /> Filters & Sorting
          </div>
          <div className="w-full lg:w-96">
            <TextField
              fullWidth
              size="small"
              placeholder="Search orders by ID, buyer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} className="text-slate-400" />
                  </InputAdornment>
                )
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          {/* Status Filter */}
          <TextField
            select
            fullWidth
            size="small"
            label="Order Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="PROCESSING">Processing</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
            <MenuItem value="CANCELLED">Cancelled</MenuItem>
          </TextField>

          {/* Sort By */}
          <TextField
            select
            fullWidth
            size="small"
            label="Sort By"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <MenuItem value="date_desc">Date (Newest First)</MenuItem>
            <MenuItem value="date_asc">Date (Oldest First)</MenuItem>
            <MenuItem value="amount_desc">Amount (High to Low)</MenuItem>
            <MenuItem value="amount_asc">Amount (Low to High)</MenuItem>
          </TextField>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-slate-200 dark:border-dark-border overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-primary-600 mb-4"></div>
            <p className="text-slate-500 font-medium">Loading orders...</p>
          </div>
        ) : filteredAndSortedOrders.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-slate-50 dark:bg-dark-bg rounded-full flex items-center justify-center mb-4 border border-slate-100 dark:border-dark-border">
              <Package size={40} className="text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No Orders Found</h3>
            <p className="text-slate-500 max-w-md">There are no orders matching your current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-dark-bg/80 border-b border-slate-100 dark:border-dark-border text-md font-medium text-slate-600 dark:text-slate-300">
                  <th className="p-4 pl-6 text-md font-medium">Order No.</th>
                  <th className="p-4 text-md font-medium">Buyer Info</th>
                  <th className="p-4 text-md font-medium">Date</th>
                  <th className="p-4 text-md font-medium">Amount</th>
                  <th className="p-4 text-md font-medium">Status</th>
                  <th className="p-4 pr-6 text-right text-md font-medium">Actions</th>
                </tr>
              </thead>
              <motion.tbody
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="divide-y divide-slate-100 dark:divide-dark-border"
              >
                {filteredAndSortedOrders.map(order => (
                  <motion.tr
                    variants={itemVariants}
                    key={order.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-dark-bg/50 transition-colors group"
                  >
                    <td className="p-4 pl-6">
                      <span className="font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-dark-bg px-2.5 py-1 rounded-md border border-slate-200 dark:border-dark-border font-mono text-xs">{order.orderNumber}</span>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-800 dark:text-white text-md">{order.buyer?.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono bg-slate-100 dark:bg-dark-bg inline-block px-1.5 py-0.5 rounded border border-slate-200 dark:border-dark-border">{order.buyer?.code || 'B2B Client'}</p>
                    </td>
                    <td className="p-4 font-medium text-slate-600 dark:text-slate-400 text-sm">
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1.5 text-slate-400" />
                        {new Date(order.orderDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-800 dark:text-white text-sm">₹{formatPrice(order.grandTotal.toFixed(2))}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 pr-6">
                      <div className="flex justify-end gap-2">
                        {order.status === 'PROCESSING' && (
                          <button onClick={() => navigate('/admin/dispatches')} className="flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 dark:text-emerald-400 transition-all" title="Create Dispatch">
                            <Truck size={14} className="mr-1.5" />
                            Dispatch
                          </button>
                        )}
                        <button onClick={() => handleViewOrder(order.id)} className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${order.status === 'PENDING' ? 'text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm hover:-translate-y-0.5' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 dark:text-indigo-400'}`} title={order.status === 'PENDING' ? 'Review & Approve' : 'View Details'}>
                          {order.status === 'PENDING' ? <CheckCircle size={14} className="mr-1.5" /> : <Eye size={14} className="mr-1.5" />}
                          {order.status === 'PENDING' ? 'Review' : 'View'}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Approval Modal */}
      <AnimatePresence>
        {isModalOpen && selectedOrder && (
          <div className="fixed modal_main inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={closeModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-100 dark:border-dark-border flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100 dark:border-dark-border bg-slate-50/80 dark:bg-dark-bg/50 shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                    Review Order
                  </h2>
                  <p className="text-sm text-slate-500 font-mono mt-1">{selectedOrder.orderNumber}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-lg border text-xs font-bold tracking-wide uppercase ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</span>
                  <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2 hover:bg-slate-200 dark:hover:bg-dark-bg rounded-xl">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto space-y-8 bg-slate-50/30 dark:bg-transparent">
                <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border shadow-sm p-4 mb-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-dark-border">
                    {/* Buyer Details */}
                    <div className="flex items-start gap-4 pb-6 md:pb-0">
                      <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                        <User size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Customer</p>
                        <p className="font-semibold text-slate-800 dark:text-white text-lg">{selectedOrder.buyer?.name}</p>
                        <p className="text-xs font-mono text-slate-500 mt-1 bg-slate-100 dark:bg-dark-bg inline-block px-2 py-0.5 rounded border border-slate-200 dark:border-dark-border">{selectedOrder.buyer?.code}</p>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-start gap-4 py-6 md:py-0 md:px-8">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Calendar size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Order Date</p>
                        <p className="font-semibold text-slate-800 dark:text-white text-lg">{new Date(selectedOrder.orderDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        <p className="text-sm text-slate-500 mt-0.5">{new Date(selectedOrder.orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>

                    {/* Transporter */}
                    <div className="flex items-start gap-4 pt-6 md:pt-0 md:pl-8">
                      <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                        <Truck size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Transporter</p>
                        <p className="font-semibold text-slate-800 dark:text-white text-lg">{selectedOrder.transporter?.name || <span className="text-slate-400 font-medium text-md">Unassigned</span>}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {(selectedOrder.remarks || (selectedOrder.approvals && selectedOrder.approvals.length > 0 && selectedOrder.approvals[0].remarks)) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
                    {selectedOrder.remarks && (
                      <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-900/30 flex gap-4">
                        <div className="mt-0.5 text-indigo-400"><MessageSquare size={20} /></div>
                        <div>
                          <p className="text-md font-semibold text-indigo-800 dark:text-indigo-300 mb-1">Buyer Notes</p>
                          <p className="text-sm text-indigo-700 dark:text-indigo-400 leading-relaxed">{selectedOrder.remarks}</p>
                        </div>
                      </div>
                    )}
                    {selectedOrder.approvals && selectedOrder.approvals.length > 0 && selectedOrder.approvals[0].remarks && (
                      <div className="bg-slate-50 dark:bg-dark-bg rounded-2xl p-5 border border-slate-200 dark:border-dark-border flex gap-4">
                        <div className="mt-0.5 text-indigo-500"><CheckCircle size={20} /></div>
                        <div>
                          <p className="text-sm font-bold text-indigo-800 dark:text-indigo-300 mb-1">Admin Feedback</p>
                          <p className="text-sm text-indigo-700 dark:text-indigo-400 leading-relaxed">{selectedOrder.approvals[0].remarks}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-end mb-4">
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center">
                      <ShoppingCart size={20} className="mr-2 text-primary-600" /> Order Items
                    </h3>
                  </div>

                  <div className="border border-slate-200 dark:border-dark-border rounded-xl bg-white dark:bg-dark-card shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-dark-bg border-b border-slate-200 dark:border-dark-border">
                        <tr>
                          <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Design</th>
                          <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Request Qty</th>
                          <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Stock Status</th>
                          <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Unit Price</th>
                          <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                        {selectedOrder.items.map(item => {
                          const isShort = item.quantity > item.design.availableStock;
                          return (
                            <tr key={item.id} className={`${isShort ? 'bg-red-50/30 dark:bg-red-900/5' : 'hover:bg-slate-50/50 dark:hover:bg-dark-bg/50'} transition-colors`}>
                              <td className="p-4 flex items-center">
                                <div className="w-10 h-10 rounded bg-slate-100 mr-3 flex-shrink-0 overflow-hidden border border-slate-200">
                                  {item.design.image ? (
                                    <img src={`http://localhost:5000${item.design.image.split(',')[0].trim().replace(/\\/g, '/')}`} className="w-full h-full object-cover" alt="" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300"><Package size={20} /></div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-800 dark:text-slate-200 text-base">
                                    {item.design.name} {item.color ? `(${item.color})` : ''}
                                  </p>
                                  <p className="text-xs text-slate-500 font-medium font-mono mt-0.5">{item.design.code}</p>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={`text-base font-bold ${isShort ? 'text-red-600' : 'text-slate-700 dark:text-slate-200'}`}>{item.quantity}</span>
                              </td>
                              <td className="p-4">
                                <div className={`inline-flex items-center px-2 py-1 rounded-md border text-xs font-bold ${isShort ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                                  {item.design.availableStock} in stock
                                </div>
                              </td>
                              <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">₹{formatPrice(item.rate.toFixed(2))}</td>
                              <td className="p-4 text-right font-semibold text-slate-800 dark:text-slate-200 text-base">₹{formatPrice(item.lineTotal.toFixed(2))}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {selectedOrder.items.some(i => i.quantity > i.design.availableStock) && (
                    <div className="mt-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-900/50 flex items-start shadow-sm">
                      <XCircle size={20} className="mr-3 shrink-0 text-red-500" />
                      <div>
                        <p className="font-bold mb-1">Insufficient Stock Warning</p>
                        <p className="text-sm">Some requested items exceed the currently available stock. Approving this order might require backordering or partial fulfillment.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <div className="bg-white dark:bg-dark-card p-6 rounded-xl border border-slate-200 dark:border-dark-border shadow-sm w-full md:w-80">
                    <div className="space-y-3 mb-4">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 flex justify-between"><span>Subtotal</span> <span className="font-bold text-slate-800 dark:text-slate-200">₹{formatPrice(selectedOrder.totalAmount.toFixed(2))}</span></p>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 flex justify-between"><span>GST</span> <span className="font-bold text-slate-800 dark:text-slate-200">₹{formatPrice(selectedOrder.gstAmount.toFixed(2))}</span></p>
                    </div>
                    <div className="pt-4 border-t border-slate-200 dark:border-dark-border flex justify-between items-center">
                      <span className="text-base font-bold text-slate-800 dark:text-white">Grand Total</span>
                      <span className="text-xl font-semibold text-primary-600 dark:text-primary-400">₹{formatPrice(selectedOrder.grandTotal.toFixed(2))}</span>
                    </div>
                  </div>
                </div>

                {selectedOrder.status === 'PENDING' && (
                  <div className="bg-white dark:bg-dark-card p-5 rounded-xl border border-slate-200 dark:border-dark-border shadow-sm">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Admin Action</h4>
                    <TextField
                      label="Approval / Rejection Remarks (Optional)"
                      multiline
                      rows={4}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Add a note for the buyer before approving or rejecting..."
                      fullWidth
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: '0.75rem' }
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center px-8 py-5 mt-auto border-t border-slate-100 dark:border-dark-border bg-slate-50/80 dark:bg-dark-bg/50 shrink-0">
                <button onClick={closeModal} className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl shadow-sm transition-all">
                  {selectedOrder.status === 'PENDING' ? 'Cancel' : 'Close Details'}
                </button>

                {selectedOrder.status === 'PENDING' && (
                  <div className="flex space-x-3">
                    <button onClick={() => handleUpdateStatus(selectedOrder.id, 'CANCELLED')} className="px-6 py-2.5 text-sm font-medium bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl shadow-sm transition-all flex items-center hover:-translate-y-0.5">
                      <XCircle size={18} className="mr-2" /> Reject Order
                    </button>
                    <button onClick={() => handleUpdateStatus(selectedOrder.id, 'PROCESSING')} className="px-6 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-500 rounded-xl shadow-sm shadow-green-600/30 transition-all flex items-center hover:-translate-y-0.5">
                      <CheckCircle size={18} className="mr-2" /> Approve & Move to Dispatche
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmDialog.open}
        onConfirm={executeUpdateStatus}
        onCancel={() => setConfirmDialog({ open: false, orderId: null, status: '' })}
        title={confirmDialog.status === 'CANCELLED' ? 'Reject this order?' : 'Approve this order?'}
        message={confirmDialog.status === 'CANCELLED' ? 'This action will reject the order and notify the buyer. This cannot be undone.' : 'This will approve the order and reserve stock for the buyer and move to dispatches.'}
        confirmText={confirmDialog.status === 'CANCELLED' ? 'Yes, Reject' : 'Yes, Approve'}
        cancelText="Go Back"
        variant={confirmDialog.status === 'CANCELLED' ? 'danger' : 'success'}
      />
    </div>
  );
};

export default AdminOrders;
