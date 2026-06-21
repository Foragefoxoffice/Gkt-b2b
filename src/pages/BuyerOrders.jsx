import { useState, useEffect } from 'react';
import { getOrdersApi, updateOrderStatusApi, getOrderByIdApi, addToCartApi } from '../Action/api';
import { useNavigate } from 'react-router-dom';
import { Clock, Eye, RefreshCw, ShoppingCart, XCircle, Package, TrendingUp, TrendingDown, MoreHorizontal, FileText, Search, SlidersHorizontal, Calendar, Truck, MessageSquare, CheckCircle, PackageCheck, Download } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { TextField, MenuItem, InputAdornment, Select } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from '../components/ConfirmDialog';
import orderCanceledSound from '../assets/order_canceled.mp3';
import ImageZoom from '../components/ImageZoom';

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


const getVariantImage = (design, colorName) => {
  if (!design || !design.image) return '';
  const imagesList = design.image.split(',').map(img => img.trim()).filter(Boolean);
  if (imagesList.length === 0) return '';

  if (colorName && design.imageColorMap) {
    try {
      const colorMap = typeof design.imageColorMap === 'string'
        ? JSON.parse(design.imageColorMap)
        : design.imageColorMap;
      if (Array.isArray(colorMap)) {
        const colorIndex = colorMap.findIndex(
          c => c && c.trim().toLowerCase() === colorName.trim().toLowerCase()
        );
        if (colorIndex !== -1 && imagesList[colorIndex]) {
          return imagesList[colorIndex];
        }
      }
    } catch (e) {
      console.error('Error parsing imageColorMap', e);
    }
  }
  return imagesList[0] || '';
};

const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `http://localhost:5000${path.replace(/\\/g, '/')}`;
};

const BuyerOrders = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('date_desc');

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ totalOrders: 0, pendingOrders: 0, totalAmount: 0 });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: searchTerm || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        sortBy
      };
      const res = await getOrdersApi(params);
      setOrders(res.data.data);
      if (res.data.pagination) {
        setTotal(res.data.pagination.total);
        setTotalPages(res.data.pagination.totalPages);
        if (res.data.pagination.stats) {
          setStats(res.data.pagination.stats);
        }
      }
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, searchTerm, statusFilter, sortBy]);

  useEffect(() => {
    const handleOrdersUpdated = () => {
      fetchOrders();
    };
    window.addEventListener('ordersUpdated', handleOrdersUpdated);
    return () => window.removeEventListener('ordersUpdated', handleOrdersUpdated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, searchTerm, statusFilter, sortBy]);

  const handleCancelOrder = (orderId) => {
    setConfirmCancelId(orderId);
  };

  const executeCancelOrder = async () => {
    const orderId = confirmCancelId;
    setConfirmCancelId(null);
    try {
      await updateOrderStatusApi(orderId, { status: 'CANCELLED', remarks: 'Cancelled by buyer' });
      toast.success('Order cancelled');
      const audio = new Audio(orderCanceledSound);
      audio.play().catch(e => console.log('Audio playback failed:', e));
      fetchOrders();
      window.dispatchEvent(new Event('ordersUpdated'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleViewOrder = async (orderId) => {
    try {
      const res = await getOrderByIdApi(orderId);
      setSelectedOrder(res.data.data);
      setIsModalOpen(true);
    } catch {
      toast.error('Failed to load order details');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedOrder(null), 300); // clear after animation
  };

  const handleRepeatOrder = async (order) => {
    try {
      const res = await getOrderByIdApi(order.id);
      const orderDetails = res.data.data;

      let successCount = 0;
      for (const item of orderDetails.items) {
        try {
          await addToCartApi({ designId: item.designId, quantity: item.quantity, color: item.color });
          successCount++;
        } catch {
          console.error('Failed to add item', item.designId);
        }
      }

      if (successCount > 0) {
        toast.success(`Added ${successCount} items to cart`);
        window.dispatchEvent(new Event('cartUpdated'));
        navigate('/buyer/cart');
      } else {
        toast.error('Could not add any items to cart (they may be out of stock)');
      }
    } catch {
      toast.error('Failed to repeat order');
    }
  };

  const formatPrice = (val) => {
    if (val === undefined || val === null) return '';
    const [intPart, decPart] = val.toString().split('.');
    const formattedInt = intPart.replace(/(\d)(?=(\d\d)+\d$)/g, "$1,");
    return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
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

  // Calculate KPIs
  const totalOrders = stats.totalOrders;
  const pendingOrders = stats.pendingOrders;
  const totalSpend = stats.totalAmount;

  // Filtering & Sorting is done via API
  const filteredAndSortedOrders = orders;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, page - 2);
      let end = Math.min(totalPages, page + 2);

      if (start === 1) {
        end = maxVisible;
      } else if (end === totalPages) {
        start = totalPages - maxVisible + 1;
      }

      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

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
    <div className="space-y-6 mx-auto">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-white flex items-center">
            <FileText className="mr-3 text-primary-600" /> Order History
          </h1>
          <p className="text-sm text-slate-500 mt-1">Review, track, and manage your past and current orders.</p>
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
          title="Pending Processing"
          value={pendingOrders}
          trend="-4.2%"
          isPositive={false}
          sparklineData={[{ value: 70 }, { value: 60 }, { value: 50 }, { value: 40 }, { value: 55 }, { value: 45 }, { value: 30 }]}
          color="#f43f5e"
        />
        <KPICard
          title="Total Spend"
          value={`₹${formatPrice(totalSpend.toFixed(0))}`}
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
              placeholder="Search orders by ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
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
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
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
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
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
            <p className="text-slate-500 font-medium">Loading your orders...</p>
          </div>
        ) : filteredAndSortedOrders.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <ShoppingCart size={40} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No Orders Found</h3>
            <p className="text-slate-500 max-w-md">There are no orders matching your current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-dark-bg border-b border-slate-200 dark:border-dark-border">
                  <th className="p-4 pl-6 font-semibold text-slate-600 dark:text-slate-300">Order ID</th>
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Date Placed</th>
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Total Amount</th>
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                  <th className="p-4 pr-6 font-semibold text-slate-600 dark:text-slate-300 text-right">Quick Actions</th>
                </tr>
              </thead>
              <motion.tbody
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="divide-y divide-slate-100 dark:divide-dark-border"
              >
                {filteredAndSortedOrders.map((order) => (
                  <motion.tr
                    variants={itemVariants}
                    key={order.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-dark-bg/50 transition-colors group"
                  >
                    <td className="p-4 pl-6">
                      <span className="font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-dark-bg px-2.5 py-1 rounded-md border border-slate-200 dark:border-dark-border font-mono text-xs">{order.orderNumber}</span>
                    </td>
                    <td className="p-4 font-medium text-slate-600 dark:text-slate-400 text-sm">
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1.5 text-slate-400" />
                        {new Date(order.orderDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-800 dark:text-white text-sm">₹{formatPrice(order.grandTotal.toFixed(2))}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 pr-6">
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => handleViewOrder(order.id)} className="flex items-center px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors" title="View Details">
                          <Eye size={14} className="mr-1.5" /> View
                        </button>
                        <button onClick={() => handleRepeatOrder(order)} className="flex items-center px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors" title="Reorder Items">
                          <RefreshCw size={14} className="mr-1.5" /> Reorder
                        </button>
                        {order.status === 'PENDING' && (
                          <button onClick={() => handleCancelOrder(order.id)} className="flex items-center px-3 py-1.5 text-xs font-medium text-red-600 bg-white hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition-all" title="Cancel Order">
                            <XCircle size={14} className="mr-1.5" /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
            {/* Pagination Controls */}
            {!loading && total > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-4 border-t border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/20">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{(page - 1) * limit + 1}</span> to{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {Math.min(page * limit, total)}
                    </span> of{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{total}</span> orders
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <span className="hidden sm:inline text-slate-300">|</span>
                    <span>Show</span>
                    <Select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                      }}
                      size="small"
                      sx={{
                        height: 32,
                        minWidth: 70,
                        backgroundColor: 'white',
                        '.MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgb(226, 232, 240)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgb(203, 213, 225)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgb(99, 102, 241)',
                        },
                        color: 'rgb(51, 65, 85)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        '.dark &': {
                          backgroundColor: '#1e293b',
                          color: '#f8fafc',
                          '.MuiOutlinedInput-notchedOutline': {
                            borderColor: '#334155',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#475569',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#6366f1',
                          },
                        }
                      }}
                    >
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={20}>20</MenuItem>
                      <MenuItem value={50}>50</MenuItem>
                      <MenuItem value={100}>100</MenuItem>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border text-sm font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-dark-card hover:bg-slate-50 dark:hover:bg-dark-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  {getPageNumbers().map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${page === p
                        ? 'bg-primary-600 text-white'
                        : 'border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 bg-white dark:bg-dark-card hover:bg-slate-50 dark:hover:bg-dark-bg'
                        }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border text-sm font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-dark-card hover:bg-slate-50 dark:hover:bg-dark-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Details Modal with Framer Motion */}
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
              className="relative bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-100 dark:border-dark-border flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100 dark:border-dark-border bg-slate-50/80 dark:bg-dark-bg/50 shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                    Order Details
                  </h2>
                  <p className="text-sm text-slate-500 font-mono mt-1">{selectedOrder.orderNumber}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</span>
                  <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2 hover:bg-slate-200 dark:hover:bg-dark-bg rounded-xl">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto space-y-8 bg-slate-50/30 dark:bg-transparent">
                <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border shadow-sm p-4 mb-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-dark-border">
                    {/* Date */}
                    <div className="flex items-start gap-4 pb-6 md:pb-0">
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
                        <p className="font-semibold text-slate-800 dark:text-white text-lg">{selectedOrder.transporter?.name || <span className="text-slate-400 italic font-medium">Unassigned</span>}</p>
                        <p className="text-sm text-slate-500 mt-0.5">{selectedOrder.transporter?.mobile || <span className="text-slate-400 italic font-medium">Unassigned</span>}</p>
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
                          <p className="text-md font-semibold text-indigo-800 dark:text-indigo-300 mb-1">Your Notes</p>
                          <p className="text-sm text-indigo-700 dark:text-indigo-400 leading-relaxed">{selectedOrder.remarks}</p>
                        </div>
                      </div>
                    )}
                    {selectedOrder.approvals && selectedOrder.approvals.length > 0 && selectedOrder.approvals[0].remarks && (
                      <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-900/30 flex gap-4">
                        <div className="mt-0.5 text-indigo-500"><CheckCircle size={20} /></div>
                        <div>
                          <p className="text-sm font-bold text-indigo-800 dark:text-indigo-300 mb-1">Admin Feedback</p>
                          <p className="text-sm text-indigo-700 dark:text-indigo-400 leading-relaxed">{selectedOrder.approvals[0].remarks}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedOrder.dispatches && selectedOrder.dispatches.length > 0 && (
                  <div className="space-y-4 mb-2">
                    {selectedOrder.dispatches.map((dispatch) => (
                      <div key={dispatch.id} className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-900/30">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="text-emerald-500"><PackageCheck size={20} /></div>
                          <h3 className="text-md font-bold text-emerald-800 dark:text-emerald-300">Dispatch: {dispatch.dispatchNumber}</h3>
                          <span className={`px-2 py-0.5 ml-auto text-[10px] font-bold uppercase rounded-full border ${dispatch.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>{dispatch.status}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {dispatch.trackingNumber ? (
                            <div className="bg-white/60 dark:bg-dark-card/50 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Tracking Number / LR</p>
                              <p className="font-mono font-medium text-slate-800 dark:text-slate-200">{dispatch.trackingNumber}</p>
                            </div>
                          ) : (
                            <div className="bg-white/60 dark:bg-dark-card/50 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/30 opacity-60">
                              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Tracking Number / LR</p>
                              <p className="font-medium text-slate-400 dark:text-slate-500 italic">Not available</p>
                            </div>
                          )}

                          <div className={`p-3 rounded-xl border ${dispatch.bookingCopy ? 'bg-white/60 dark:bg-dark-card/50 border-emerald-100 dark:border-emerald-800/30' : 'bg-transparent border-dashed border-slate-200 dark:border-dark-border opacity-50'}`}>
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Booking Copy (LR)</p>
                            {dispatch.bookingCopy ? (
                              <a href={getImageUrl(dispatch.bookingCopy)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                                <FileText size={14} /> View Document
                              </a>
                            ) : (
                              <p className="text-sm text-slate-400 italic">Pending upload</p>
                            )}
                          </div>

                          <div className={`p-3 rounded-xl border ${dispatch.invoiceCopy ? 'bg-white/60 dark:bg-dark-card/50 border-emerald-100 dark:border-emerald-800/30' : 'bg-transparent border-dashed border-slate-200 dark:border-dark-border opacity-50'}`}>
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Invoice Copy</p>
                            {dispatch.invoiceCopy ? (
                              <a href={getImageUrl(dispatch.invoiceCopy)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                                <FileText size={14} /> View Document
                              </a>
                            ) : (
                              <p className="text-sm text-slate-400 italic">Pending upload</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-white mb-4 text-lg flex items-center">
                    <ShoppingCart size={20} className="mr-2 text-primary-600" /> Items in Order
                  </h3>
                  <div className="border border-slate-200 dark:border-dark-border rounded-xl bg-white dark:bg-dark-card shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-dark-bg border-b border-slate-200 dark:border-dark-border">
                        <tr>
                          <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Design Detail</th>
                          <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Qty</th>
                          <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Unit Price</th>
                          <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                        {selectedOrder.items.map(item => {
                          const variantImage = getVariantImage(item.design, item.color);
                          const imageUrl = getImageUrl(variantImage);
                          return (
                            <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-bg/50 transition-colors">
                              <td className="p-4 flex items-center">
                                <div
                                  className="w-10 h-10 rounded bg-slate-100 mr-3 flex-shrink-0 overflow-hidden border border-slate-200 cursor-pointer hover:opacity-80 hover:scale-105 active:scale-95 transition-all duration-200"
                                  onClick={() => imageUrl && setPreviewImage(imageUrl)}
                                  title="Click to view image"
                                >
                                  {variantImage ? (
                                    <img src={imageUrl} className="w-full h-full object-cover" alt="" />
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
                              <td className="p-4 font-bold text-slate-700 text-base">{item.quantity}</td>
                              <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">₹{formatPrice(item.rate.toFixed(2))}</td>
                              <td className="p-4 text-right font-semibold text-slate-800 dark:text-slate-200 text-base">₹{formatPrice(item.lineTotal.toFixed(2))}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
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
              </div>

              <div className="flex justify-between items-center px-8 py-5 mt-auto border-t border-slate-100 dark:border-dark-border bg-slate-50/80 dark:bg-dark-bg/50 shrink-0">
                <button onClick={closeModal} className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl shadow-sm transition-all">
                  Close Details
                </button>
                <button onClick={() => { closeModal(); handleRepeatOrder(selectedOrder); }} className="px-6 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-500 rounded-xl shadow-sm shadow-primary-500/30 transition-all flex items-center hover:-translate-y-0.5">
                  <RefreshCw size={18} className="mr-2" /> Reorder All Items
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!confirmCancelId}
        onConfirm={executeCancelOrder}
        onCancel={() => setConfirmCancelId(null)}
        title="Cancel this order?"
        message="This will cancel your order. If items were already reserved, they will be released back to stock."
        confirmText="Yes, Cancel Order"
        cancelText="Keep Order"
        variant="danger"
      />

      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
            className="fixed modal_main inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-4xl w-full max-h-[90vh] bg-transparent flex items-center justify-center"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute -top-12 right-0 md:-right-[-120px] z-10 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
              <ImageZoom src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain drop-shadow-2xl rounded-2xl" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BuyerOrders;
