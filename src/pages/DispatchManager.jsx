import React, { useState, useEffect } from 'react';
import { getDispatchesApi, getOrdersApi, getTransportersApi, createDispatchApi, updateDispatchStatusApi } from '../Action/api';
import { useSelector } from 'react-redux';
import { Truck, Plus, X, FileText, MessageSquare, Star, User, Search, SlidersHorizontal, Archive, PackageCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { TextField, MenuItem, InputAdornment } from '@mui/material';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import { motion, AnimatePresence } from 'framer-motion';

const DispatchManager = () => {
  const { token } = useSelector(state => state.auth);

  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Data for create modal
  const [approvedOrders, setApprovedOrders] = useState([]);
  const [transporters, setTransporters] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    orderId: '',
    transporterId: '',
    numberOfBundles: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, dispatchId: null, status: '' });

  // Delivery modal state
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryDispatchId, setDeliveryDispatchId] = useState(null);
  const [deliveryForm, setDeliveryForm] = useState({ trackingNumber: '' });
  const [deliveryFiles, setDeliveryFiles] = useState({ bookingCopy: null, invoiceCopy: null });
  const [isDelivering, setIsDelivering] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [transporterFilter, setTransporterFilter] = useState('ALL');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (debouncedSearchTerm !== searchTerm) {
        setDebouncedSearchTerm(searchTerm);
        setPage(1); // Reset page on new search
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearchTerm]);

  // Fetch when any relevant state changes
  useEffect(() => {
    fetchDispatches();
  }, [page, limit, debouncedSearchTerm, statusFilter, transporterFilter]);

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    const handleDispatchesUpdated = () => {
      fetchDispatches();
    };
    const handleOrdersUpdated = () => {
      fetchOptions();
    };

    window.addEventListener('dispatchesUpdated', handleDispatchesUpdated);
    window.addEventListener('ordersUpdated', handleOrdersUpdated);
    return () => {
      window.removeEventListener('dispatchesUpdated', handleDispatchesUpdated);
      window.removeEventListener('ordersUpdated', handleOrdersUpdated);
    };
  }, []);

  const fetchDispatches = async () => {
    setLoading(true);
    try {
      const res = await getDispatchesApi({
        page,
        limit,
        search: debouncedSearchTerm,
        status: statusFilter,
        transporterId: transporterFilter
      });
      setDispatches(res.data.data);
      if (res.data.pagination) {
        setTotalPages(res.data.pagination.totalPages);
        setTotalItems(res.data.pagination.total || 0);
      }
    } catch (err) {
      toast.error('Failed to load dispatches');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [ordersRes, transRes] = await Promise.all([
        getOrdersApi(),
        getTransportersApi()
      ]);
      setApprovedOrders(ordersRes.data.data.filter(o => o.status === 'PROCESSING'));
      setTransporters(transRes.data.data);
    } catch (err) {
      console.error('Failed to load options', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'orderId') {
      const selectedOrder = approvedOrders.find(o => o.id === value || o.id === parseInt(value));
      const preferredTransporterId = selectedOrder?.transporter?.id || '';

      setFormData({
        ...formData,
        orderId: value,
        transporterId: preferredTransporterId
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.orderId || !formData.transporterId || !formData.numberOfBundles) {
      return toast.error('Please fill required fields');
    }

    setIsSubmitting(true);
    try {
      const form = new FormData();
      Object.keys(formData).forEach(key => form.append(key, formData[key]));

      await createDispatchApi(form);

      toast.success('Dispatch created successfully');
      setIsModalOpen(false);
      setFormData({ orderId: '', transporterId: '', numberOfBundles: '' });
      fetchDispatches();
      fetchOptions(); // Refresh approved orders
      window.dispatchEvent(new Event('dispatchesUpdated'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create dispatch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = (dispatchId, newStatus) => {
    setConfirmDialog({ open: true, dispatchId, status: newStatus });
  };

  const openDeliveryModal = (dispatchId) => {
    setDeliveryDispatchId(dispatchId);
    setDeliveryForm({ trackingNumber: '' });
    setDeliveryFiles({ bookingCopy: null, invoiceCopy: null });
    setShowDeliveryModal(true);
  };

  const handleDeliverySubmit = async () => {
    setIsDelivering(true);
    try {
      const form = new FormData();
      form.append('status', 'DELIVERED');
      if (deliveryForm.trackingNumber) form.append('trackingNumber', deliveryForm.trackingNumber);
      if (deliveryFiles.bookingCopy) form.append('bookingCopy', deliveryFiles.bookingCopy);
      if (deliveryFiles.invoiceCopy) form.append('invoiceCopy', deliveryFiles.invoiceCopy);

      await updateDispatchStatusApi(deliveryDispatchId, form);
      toast.success('Dispatch marked as delivered!');
      setShowDeliveryModal(false);
      fetchDispatches();
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark as delivered');
    } finally {
      setIsDelivering(false);
    }
  };

  const executeUpdateStatus = async () => {
    const { dispatchId, status: newStatus } = confirmDialog;
    setConfirmDialog({ open: false, dispatchId: null, status: '' });
    try {
      await updateDispatchStatusApi(dispatchId, { status: newStatus });
      toast.success('Status updated');
      fetchDispatches();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'DISPATCHED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'DELIVERED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  // Server-side filtering is now used, so we just use dispatches directly.

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-white flex items-center">
          <Truck className="mr-3 text-primary-600" /> Dispatch Management
        </h1>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary flex items-center">
          <Plus size={18} className="mr-2" /> New Dispatch
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white dark:bg-dark-card p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-dark-border">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center mb-6">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-medium">
            <SlidersHorizontal size={18} className="text-primary-600" /> Filters
          </div>
          <div className="w-full lg:w-96">
            <TextField
              fullWidth
              size="small"
              placeholder="Search by dispatch, order, tracking..."
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextField
            select
            fullWidth
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="DISPATCHED">Dispatched</MenuItem>
            <MenuItem value="DELIVERED">Delivered</MenuItem>
          </TextField>

          <TextField
            select
            fullWidth
            size="small"
            label="Transporter"
            value={transporterFilter}
            onChange={(e) => {
              setTransporterFilter(e.target.value);
              setPage(1);
            }}
          >
            <MenuItem value="ALL">All Transporters</MenuItem>
            {transporters.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
          </TextField>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-slate-200 dark:border-dark-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading dispatches...</div>
        ) : dispatches.length === 0 ? (
          <div className="p-16 text-center">
            <Archive className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-600 dark:text-slate-300 text-lg font-medium">No dispatches found</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-dark-bg border-b border-slate-200 dark:border-dark-border">
                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Dispatch No.</th>
                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Order No.</th>
                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Transporter</th>
                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Tracking #</th>
                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Docs</th>
                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                  {dispatches.map(dispatch => (
                    <tr key={dispatch.id} className="hover:bg-slate-50 dark:hover:bg-dark-bg/50 transition-colors">
                      <td className="p-4 font-medium text-slate-800 dark:text-white">{dispatch.dispatchNumber}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">{dispatch.order?.orderNumber}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">{dispatch.transporter?.name}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">{dispatch.trackingNumber || '-'}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {dispatch.bookingCopy && (
                            <a href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${dispatch.bookingCopy}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800" title="Booking Copy">
                              <FileText size={18} />
                            </a>
                          )}
                          {dispatch.invoiceCopy && (
                            <a href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${dispatch.invoiceCopy}`} target="_blank" rel="noreferrer" className="text-green-600 hover:text-green-800" title="Invoice Copy">
                              <FileText size={18} />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(dispatch.status)}`}>
                          {dispatch.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end">
                          {dispatch.status === 'PENDING' && (
                            <button onClick={() => handleUpdateStatus(dispatch.id, 'DISPATCHED')} className="btn btn-sm btn-primary bg-blue-600 hover:bg-blue-700">
                              Mark Dispatched
                            </button>
                          )}
                          {dispatch.status === 'DISPATCHED' && (
                            <button
                              onClick={() => openDeliveryModal(dispatch.id)}
                              className="btn btn-sm bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg shadow-sm shadow-emerald-500/30 transition-all hover:-translate-y-0.5 flex items-center gap-1.5"
                            >
                              <PackageCheck size={16} />
                              Good Tracking Details
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {totalPages > 0 && (
                <Pagination
                  page={page}
                  setPage={setPage}
                  totalPages={totalPages}
                  limit={limit}
                  setLimit={setLimit}
                  totalItems={totalItems}
                  itemName="dispatches"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Dispatch Modal */}
      {isModalOpen && (
        <div className="fixed modal_main inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-dark-border flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/20 shrink-0">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Create Dispatch</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 hover:bg-slate-100 dark:hover:bg-dark-bg rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
              <TextField
                select
                required
                label="Select Approved Order"
                name="orderId"
                value={formData.orderId}
                onChange={handleInputChange}
                helperText={approvedOrders.length === 0 ? "No approved orders available for dispatch." : ""}
                error={approvedOrders.length === 0}
              >
                <MenuItem value=""><em>-- Select Order --</em></MenuItem>
                {approvedOrders.map(o => (
                  <MenuItem key={o.id} value={o.id}>{o.orderNumber} ({o.buyer?.name}) - ₹{o.grandTotal}</MenuItem>
                ))}
              </TextField>

              {/* Buyer Preferred Transporter Info */}
              {formData.orderId && (() => {
                const selectedOrder = approvedOrders.find(o => o.id === formData.orderId || o.id === parseInt(formData.orderId));
                if (!selectedOrder) return null;

                const hasPreferredTransporter = selectedOrder.transporter;
                const hasRemarks = selectedOrder.remarks;

                if (!hasPreferredTransporter && !hasRemarks) return null;

                return (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-xl border border-amber-200 dark:border-amber-800/40 p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <User size={14} className="text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wide">Buyer Preference</p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{selectedOrder.buyer?.name}</p>
                      </div>
                    </div>

                    {hasPreferredTransporter && (
                      <div className="flex items-start gap-2.5 bg-white dark:bg-dark-card rounded-lg p-3 border border-amber-100 dark:border-dark-border">
                        <Star size={16} className="text-amber-500 mt-0.5 shrink-0 fill-amber-500" />
                        <div>
                          <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-0.5">Preferred Transporter</p>
                          <p className="text-sm font-semibold text-slate-800 dark:text-white">{selectedOrder.transporter.name}</p>
                        </div>
                      </div>
                    )}

                    {hasRemarks && (
                      <div className="flex items-start gap-2.5 bg-white dark:bg-dark-card rounded-lg p-3 border border-amber-100 dark:border-dark-border">
                        <MessageSquare size={16} className="text-indigo-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">Buyer Notes</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{selectedOrder.remarks}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <TextField
                select
                required
                label="Select Transporter"
                name="transporterId"
                value={formData.transporterId}
                onChange={handleInputChange}
              >
                <MenuItem value=""><em>-- Select Transporter --</em></MenuItem>
                {(() => {
                  const selectedOrder = approvedOrders.find(o => o.id === formData.orderId || o.id === parseInt(formData.orderId));
                  const preferredId = selectedOrder?.transporter?.id;

                  return transporters.map(t => (
                    <MenuItem key={t.id} value={t.id}>
                      <span className="flex items-center gap-2 w-full">
                        {t.name}
                        {preferredId && t.id === preferredId && (
                          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
                            <Star size={10} className="fill-amber-500 text-amber-500" /> Buyer Preferred
                          </span>
                        )}
                      </span>
                    </MenuItem>
                  ));
                })()}
              </TextField>

              <TextField
                type="number"
                required
                label="No. of Bundles"
                name="numberOfBundles"
                value={formData.numberOfBundles}
                onChange={handleInputChange}
                inputProps={{ min: 1 }}
                placeholder="e.g., 5"
              />

              <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-slate-100 dark:border-dark-border">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg shadow-sm transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting || approvedOrders.length === 0} className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-500 rounded-lg shadow-sm shadow-primary-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
                  {isSubmitting ? 'Creating...' : 'Create Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        onConfirm={executeUpdateStatus}
        onCancel={() => setConfirmDialog({ open: false, dispatchId: null, status: '' })}
        title={'Mark as Dispatched?'}
        message={'This will update the dispatch status to dispatched and notify relevant parties.'}
        confirmText={'Yes, Mark Dispatched'}
        cancelText="Cancel"
        variant={'info'}
      />

      {/* Mark as Delivered Modal */}
      <AnimatePresence>
        {showDeliveryModal && (
          <div className="fixed modal_main inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-dark-border"
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-dark-border bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <PackageCheck size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Good Tracking Details</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Add delivery details before completing</p>
                  </div>
                </div>
                <button onClick={() => setShowDeliveryModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 hover:bg-slate-100 dark:hover:bg-dark-bg rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <TextField
                  fullWidth
                  label="Tracking Number"
                  value={deliveryForm.trackingNumber}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, trackingNumber: e.target.value })}
                  placeholder="Enter LR / Tracking Number"
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Booking Copy (LR)</label>
                  <div className="relative">
                    <input
                      type="file"
                      onChange={(e) => setDeliveryFiles({ ...deliveryFiles, bookingCopy: e.target.files[0] })}
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-600 hover:file:bg-emerald-100 dark:file:bg-emerald-900/20 dark:file:text-emerald-400"
                    />
                    {deliveryFiles.bookingCopy && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 block">✓ {deliveryFiles.bookingCopy.name}</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Invoice Copy</label>
                  <div className="relative">
                    <input
                      type="file"
                      onChange={(e) => setDeliveryFiles({ ...deliveryFiles, invoiceCopy: e.target.files[0] })}
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-600 hover:file:bg-emerald-100 dark:file:bg-emerald-900/20 dark:file:text-emerald-400"
                    />
                    {deliveryFiles.invoiceCopy && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 block">✓ {deliveryFiles.invoiceCopy.name}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 px-6 py-4 border-t border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/20">
                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(false)}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg shadow-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDelivering}
                  onClick={handleDeliverySubmit}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm shadow-emerald-500/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                >
                  <PackageCheck size={18} />
                  {isDelivering ? 'Submitting...' : 'Confirm Delivery'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed modal_main inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white dark:bg-dark-card rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-slate-100 dark:border-dark-border"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", damping: 15, stiffness: 200 }}
                className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <PackageCheck size={48} className="text-emerald-600 dark:text-emerald-400" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold text-slate-800 dark:text-white mb-2"
              >
                Dispatch Completed!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-slate-500 dark:text-slate-400 mb-8"
              >
                The dispatch has been marked as delivered.
              </motion.p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DispatchManager;
