import { useState, useEffect } from 'react';
import { getProductRequestsApi, getProductRequestByIdApi } from '../Action/api';
import { Link } from 'react-router-dom';
import { Package, Eye, Clock, Search, SlidersHorizontal, User, Calendar, MessageSquare, Zap, CheckCircle, PackageCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { TextField, MenuItem, InputAdornment, Select } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import ImageZoom from '../components/ImageZoom';

const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${path.replace(/\\/g, '/')}`;
};

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
    } catch (e) { }
  }
  return imagesList[0] || '';
};

// Request Stepper Component
const RequestStepper = ({ status }) => {
  // Define steps
  const steps = [
    { key: 'PENDING', label: 'Pending', description: 'Request submitted for review' },
    { key: 'PROCESSING', label: 'Processing', description: 'Request approved & in production' },
    { key: 'COMPLETED', label: 'Completed', description: 'Items are ready for order' }
  ];

  // Map backend status to stepper index
  let currentIndex = 0;
  if (status === 'PENDING') currentIndex = 0;
  if (status === 'APPROVED') currentIndex = 1;
  if (status === 'COMPLETED') currentIndex = 2;

  const isRejected = status === 'REJECTED';

  if (isRejected) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-red-700">Request Rejected</h3>
        <p className="text-red-600 mt-1 max-w-sm">This product request was rejected by the administrator. Please contact support for more details.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl p-6 md:p-8">
      <h3 className="font-semibold text-slate-800 dark:text-white text-lg mb-6 flex items-center">
        <Zap size={20} className="mr-2 text-primary-600" /> Request Status
      </h3>

      <div className="relative">
        {/* Connecting line */}
        <div className="absolute top-6 left-12 right-12 h-1 bg-slate-200 dark:bg-dark-border rounded-full hidden sm:block"></div>
        <div
          className="absolute top-6 left-12 h-1 bg-primary-600 rounded-full transition-all duration-500 hidden sm:block"
          style={{ width: `calc(${(currentIndex / (steps.length - 1)) * 100}% - 24px)` }}
        ></div>

        <div className="flex flex-col sm:flex-row justify-between relative z-10 space-y-6 sm:space-y-0">
          {steps.map((step, index) => {
            const isActive = index <= currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={step.key} className="flex flex-col items-center text-center relative flex-1">
                {/* Mobile connecting line */}
                {index !== steps.length - 1 && (
                  <div className={`absolute top-6 left-1/2 w-0.5 h-full -z-10 sm:hidden ${isActive ? 'bg-primary-600' : 'bg-slate-200 dark:bg-dark-border'}`}></div>
                )}

                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white dark:border-dark-card shadow-sm transition-colors duration-300 z-10 ${isActive ? 'bg-primary-600 text-white shadow-primary-600/30' : 'bg-slate-100 text-slate-400 dark:bg-dark-bg dark:text-slate-500'
                    } ${isCurrent ? 'ring-4 ring-primary-100 dark:ring-primary-900/30' : ''}`}
                >
                  {index === 0 && <Clock size={20} />}
                  {index === 1 && <PackageCheck size={20} />}
                  {index === 2 && <CheckCircle size={20} />}
                </div>

                <div className="mt-3">
                  <h4 className={`font-bold ${isActive ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                    {step.label}
                  </h4>
                  <p className={`text-xs mt-1 max-w-[120px] mx-auto ${isActive ? 'text-slate-500 dark:text-slate-400' : 'text-slate-300 dark:text-slate-600'}`}>
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const BuyerRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: searchTerm || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter
      };
      const res = await getProductRequestsApi(params);
      setRequests(res.data.data);
      if (res.data.pagination) {
        setTotal(res.data.pagination.total);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  useEffect(() => {
    fetchRequests();
  }, [page, limit, searchTerm, statusFilter]);

  useEffect(() => {
    const handleRequestsUpdated = () => fetchRequests();
    window.addEventListener('productRequestsUpdated', handleRequestsUpdated);
    return () => window.removeEventListener('productRequestsUpdated', handleRequestsUpdated);
  }, [page, limit, searchTerm, statusFilter]);

  const handleViewRequest = async (requestId) => {
    try {
      const res = await getProductRequestByIdApi(requestId);
      const reqData = res.data.data;
      setSelectedRequest(reqData);
      setIsModalOpen(true);
    } catch {
      toast.error('Failed to load request details');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedRequest(null), 300);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50';
      case 'APPROVED': return 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50';
      case 'REJECTED': return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50';
      case 'COMPLETED': return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50';
      default: return 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50';
    }
  };

  const getDisplayStatus = (status) => {
    if (status === 'APPROVED') return 'PROCESSING';
    return status;
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, page - 2);
      let end = Math.min(totalPages, page + 2);
      if (start === 1) end = maxVisible;
      else if (end === totalPages) start = totalPages - maxVisible + 1;
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

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
            <Zap className="mr-3 text-amber-500" /> My Product Requests
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track the status of your requested products and custom weaving.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-card p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-dark-border">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center mb-6">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-medium">
            <SlidersHorizontal size={18} className="text-primary-600" /> Filters
          </div>
          <div className="w-full lg:w-96">
            <TextField
              fullWidth
              size="small"
              placeholder="Search by Request ID..."
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl">
          <TextField
            select
            fullWidth
            size="small"
            label="Request Status"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="APPROVED">Processing</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
            <MenuItem value="REJECTED">Rejected</MenuItem>
          </TextField>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-slate-200 dark:border-dark-border overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-primary-600 mb-4"></div>
            <p className="text-slate-500 font-medium">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-slate-50 dark:bg-dark-bg rounded-full flex items-center justify-center mb-4 border border-slate-100 dark:border-dark-border">
              <Package size={40} className="text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No Requests Found</h3>
            <p className="text-slate-500 max-w-md">You have no product requests matching your current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-dark-bg/80 border-b border-slate-100 dark:border-dark-border text-md font-medium text-slate-600 dark:text-slate-300">
                  <th className="p-4 pl-6 text-md font-medium">Request No.</th>
                  <th className="p-4 text-md font-medium">Requested Items</th>
                  <th className="p-4 text-md font-medium">Remarks</th>
                  <th className="p-4 text-md font-medium">Date</th>
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
                {requests.map(req => (
                  <motion.tr
                    variants={itemVariants}
                    key={req.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-dark-bg/50 transition-colors group"
                  >
                    <td className="p-4 pl-6">
                      <span className="font-semibold text-slate-800 dark:text-white bg-slate-100 dark:bg-dark-bg px-2.5 py-1 rounded-md border border-slate-200 dark:border-dark-border font-mono text-xs">{req.requestNumber}</span>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                      {req.items?.length > 0 ? (
                        <div>
                          <p>{req.items[0].design?.name} ({req.items[0].color || 'Default Color'})</p>
                          {req.items.length > 1 && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 font-bold">+{req.items.length - 1} more items</p>
                          )}
                        </div>
                      ) : (
                        <span className="italic text-slate-400">No items</span>
                      )}
                    </td>
                    <td className="p-4 max-w-[200px] truncate text-slate-500 text-sm italic" title={req.remarks}>
                      {req.remarks || <span className="text-slate-300 dark:text-slate-600 italic">No notes</span>}
                    </td>
                    <td className="p-4 font-medium text-slate-600 dark:text-slate-400 text-sm">
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1.5 text-slate-400" />
                        {new Date(req.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${getStatusColor(req.status)}`}>
                        {getDisplayStatus(req.status)}
                      </span>
                    </td>
                    <td className="p-4 pr-6">
                      <div className="flex justify-end">
                        <button onClick={() => handleViewRequest(req.id)} className="flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 dark:text-indigo-400 transition-all" title="View Details">
                          <Eye size={14} className="mr-1.5" /> View
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>

            {!loading && total > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-4 border-t border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/20">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{(page - 1) * limit + 1}</span> to{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {Math.min(page * limit, total)}
                    </span> of{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{total}</span> requests
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
                        '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgb(226, 232, 240)' },
                        color: 'rgb(51, 65, 85)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        '.dark &': {
                          backgroundColor: '#1e293b',
                          color: '#f8fafc',
                          '.MuiOutlinedInput-notchedOutline': { borderColor: '#334155' }
                        }
                      }}
                    >
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={20}>20</MenuItem>
                      <MenuItem value={50}>50</MenuItem>
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

      <AnimatePresence>
        {isModalOpen && selectedRequest && (
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
                  <h2 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center">
                    Request Details
                  </h2>
                  <p className="text-sm text-slate-500 font-mono mt-1">{selectedRequest.requestNumber}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-lg border text-xs font-bold tracking-wide uppercase ${getStatusColor(selectedRequest.status)}`}>{getDisplayStatus(selectedRequest.status)}</span>
                  <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2 hover:bg-slate-200 dark:hover:bg-dark-bg rounded-xl">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto space-y-8 bg-slate-50/30 dark:bg-transparent">

                {/* Stepper implementation */}
                <RequestStepper status={selectedRequest.status} />

                <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border shadow-sm p-4 mb-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-dark-border">
                    <div className="flex items-start gap-4 pb-6 md:pb-0">
                      <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                        <User size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Requested By</p>
                        <p className="font-semibold text-slate-800 dark:text-white text-lg">{selectedRequest.buyer?.name}</p>
                        <p className="text-xs font-mono text-slate-500 mt-1 bg-slate-100 dark:bg-dark-bg inline-block px-2 py-0.5 rounded border border-slate-200 dark:border-dark-border">{selectedRequest.buyer?.code}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 py-6 md:py-0 md:px-8">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Calendar size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Request Date</p>
                        <p className="font-semibold text-slate-800 dark:text-white text-lg">{new Date(selectedRequest.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        <p className="text-sm text-slate-500 mt-0.5">{new Date(selectedRequest.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedRequest.remarks && (
                  <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl p-5 border border-amber-100 dark:border-amber-900/30 flex gap-4">
                    <div className="mt-0.5 text-amber-500"><MessageSquare size={20} /></div>
                    <div>
                      <p className="text-md font-semibold text-amber-800 dark:text-amber-300 mb-1">Your Notes</p>
                      <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">{selectedRequest.remarks}</p>
                    </div>
                  </div>
                )}

                {selectedRequest.adminRemarks && (
                  <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl p-5 border border-blue-100 dark:border-blue-900/30 flex gap-4">
                    <div className="mt-0.5 text-blue-500"><MessageSquare size={20} /></div>
                    <div>
                      <p className="text-md font-semibold text-blue-800 dark:text-blue-300 mb-1">Admin Remarks</p>
                      <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">{selectedRequest.adminRemarks}</p>
                    </div>
                  </div>
                )}

                <div className='mt-0'>
                  <h3 className="font-semibold text-slate-800 dark:text-white text-lg flex items-center mb-4 mt-6">
                    <Package size={20} className="mr-2 text-primary-600" /> Requested Products
                  </h3>

                  <div className="border border-slate-200 dark:border-dark-border rounded-xl bg-white dark:bg-dark-card shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-dark-bg border-b border-slate-200 dark:border-dark-border">
                        <tr>
                          <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Design</th>
                          <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Requested Quantity</th>
                          <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                        {selectedRequest.items?.map(item => {
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
                                  <Link to={`/buyer/product/${item.design?.id}`} className="font-semibold text-slate-800 dark:text-slate-200 text-base hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm" title="View Design">
                                    {item.design?.name} {item.color ? `(${item.color})` : ''}
                                  </Link>
                                  <p className="text-xs text-slate-500 font-medium font-mono mt-0.5">{item.design?.code}</p>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="text-base font-bold text-slate-700 dark:text-slate-200">{item.quantity}</span>
                              </td>
                              <td className="p-4 text-slate-600 dark:text-slate-400 font-semibold">₹{item.design?.rate}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center px-8 py-5 mt-auto border-t border-slate-100 dark:border-dark-border bg-slate-50/80 dark:bg-dark-bg/50 shrink-0">
                <button onClick={closeModal} className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl shadow-sm transition-all ml-auto">
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute -top-10 right-0 text-white hover:text-slate-300"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
              <ImageZoom src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-slate-700/50" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BuyerRequests;
