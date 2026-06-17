import React, { useState, useEffect } from 'react';
import { getDispatchesApi, getOrdersApi, getTransportersApi, createDispatchApi, updateDispatchStatusApi } from '../Action/api';
import { useSelector } from 'react-redux';
import { Truck, Plus, X, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const DispatchManager = () => {
  const { token } = useSelector(state => state.auth);
  
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Data for create modal
  const [approvedOrders, setApprovedOrders] = useState([]);
  const [transporters, setTransporters] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    orderId: '',
    transporterId: '',
    numberOfBundles: '',
    trackingNumber: ''
  });
  const [files, setFiles] = useState({ bookingCopy: null, invoiceCopy: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDispatches();
    fetchOptions();
  }, []);

  const fetchDispatches = async () => {
    setLoading(true);
    try {
      const res = await getDispatchesApi({ limit: 50 });
      setDispatches(res.data.data);
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
      setApprovedOrders(ordersRes.data.data.filter(o => o.status === 'APPROVED'));
      setTransporters(transRes.data.data);
    } catch (err) {
      console.error('Failed to load options', err);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
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
      if (files.bookingCopy) form.append('bookingCopy', files.bookingCopy);
      if (files.invoiceCopy) form.append('invoiceCopy', files.invoiceCopy);

      await createDispatchApi(form);
      
      toast.success('Dispatch created successfully');
      setIsModalOpen(false);
      setFormData({ orderId: '', transporterId: '', numberOfBundles: '', trackingNumber: '' });
      setFiles({ bookingCopy: null, invoiceCopy: null });
      fetchDispatches();
      fetchOptions(); // Refresh approved orders
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create dispatch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (dispatchId, newStatus) => {
    if (!window.confirm(`Mark this dispatch as ${newStatus}?`)) return;
    try {
      await updateDispatchStatusApi(dispatchId, { status: newStatus });
      toast.success('Status updated');
      fetchDispatches();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'DISPATCHED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'DELIVERED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
          <Truck className="mr-3" /> Dispatch Management
        </h1>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary flex items-center">
          <Plus size={18} className="mr-2" /> New Dispatch
        </button>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-slate-200 dark:border-dark-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading dispatches...</div>
        ) : dispatches.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No dispatches found.</div>
        ) : (
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
                    <td className="p-4 flex gap-2">
                      {dispatch.bookingCopy && (
                        <a href={`http://localhost:5000${dispatch.bookingCopy}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800" title="Booking Copy">
                          <FileText size={18} />
                        </a>
                      )}
                      {dispatch.invoiceCopy && (
                        <a href={`http://localhost:5000${dispatch.invoiceCopy}`} target="_blank" rel="noreferrer" className="text-green-600 hover:text-green-800" title="Invoice Copy">
                          <FileText size={18} />
                        </a>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(dispatch.status)}`}>
                        {dispatch.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {dispatch.status === 'PENDING' && (
                        <button onClick={() => handleUpdateStatus(dispatch.id, 'DISPATCHED')} className="btn btn-sm btn-primary bg-blue-600 hover:bg-blue-700">
                          Mark Dispatched
                        </button>
                      )}
                      {dispatch.status === 'DISPATCHED' && (
                        <button onClick={() => handleUpdateStatus(dispatch.id, 'DELIVERED')} className="btn btn-sm btn-primary bg-green-600 hover:bg-green-700">
                          Mark Delivered
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Dispatch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-dark-border flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/20 shrink-0">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Create Dispatch</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 hover:bg-slate-100 dark:hover:bg-dark-bg rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Select Approved Order <span className="text-red-500">*</span></label>
                <select name="orderId" value={formData.orderId} onChange={handleInputChange} required className="input-field shadow-sm">
                  <option value="">-- Select Order --</option>
                  {approvedOrders.map(o => (
                    <option key={o.id} value={o.id}>{o.orderNumber} ({o.buyer?.name}) - ₹{o.grandTotal}</option>
                  ))}
                </select>
                {approvedOrders.length === 0 && <p className="text-xs text-red-500 mt-1">No approved orders available for dispatch.</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Select Transporter <span className="text-red-500">*</span></label>
                <select name="transporterId" value={formData.transporterId} onChange={handleInputChange} required className="input-field shadow-sm">
                  <option value="">-- Select Transporter --</option>
                  {transporters.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">No. of Bundles <span className="text-red-500">*</span></label>
                  <input type="number" name="numberOfBundles" value={formData.numberOfBundles} onChange={handleInputChange} min="1" required className="input-field shadow-sm" placeholder="e.g., 5" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Tracking Number</label>
                  <input type="text" name="trackingNumber" value={formData.trackingNumber} onChange={handleInputChange} className="input-field shadow-sm" placeholder="LR Number" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Booking Copy (LR)</label>
                <input type="file" name="bookingCopy" onChange={handleFileChange} className="input-field shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Invoice Copy</label>
                <input type="file" name="invoiceCopy" onChange={handleFileChange} className="input-field shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
              </div>

              <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-slate-100 dark:border-dark-border">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg shadow-sm transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting || approvedOrders.length === 0} className="px-5 py-2.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 rounded-lg shadow-sm shadow-primary-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
                  {isSubmitting ? 'Creating...' : 'Create Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DispatchManager;
