import React, { useState, useEffect } from 'react';
import { getBuyersApi, createBuyerApi, updateBuyerApi, deleteBuyerApi, getCompaniesApi } from '../Action/api';
import { useSelector } from 'react-redux';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { TextField, MenuItem } from '@mui/material';
import ConfirmDialog from '../components/ConfirmDialog';

const FirmBuyerManager = () => {
  const { token } = useSelector(state => state.auth);

  const [buyers, setBuyers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const [formData, setFormData] = useState({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [buyerRes, companyRes] = await Promise.all([
        getBuyersApi(),
        getCompaniesApi()
      ]);
      setBuyers(buyerRes.data.data);
      setCompanies(companyRes.data.data);
    } catch (err) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item = null) => {
    setEditItem(item);
    if (item) {
      setFormData({
        ...item,
        companyId: item.firm?.companyId || ''
      });
    } else {
      setFormData({
        name: '', code: '', companyId: '', mobile: '', mobile2: '', email: '', gst: '', pan: '', stateCode: '', branchName: '', billingAddress: '', shippingAddress: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (payload.companyId) payload.companyId = parseInt(payload.companyId);

      if (editItem) await updateBuyerApi(editItem.id, payload);
      else await createBuyerApi(payload);

      toast.success(editItem ? 'Updated successfully' : 'Created successfully');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = (id) => {
    setDeleteConfirmId(id);
  };

  const executeDelete = async () => {
    const id = deleteConfirmId;
    setDeleteConfirmId(null);
    try {
      await deleteBuyerApi(id);
      toast.success('Deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Deletion failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-white flex items-center"><Users size={22} className="mr-2 text-primary-600" /> Buyer Management</h1>
        <button onClick={() => openModal()} className="btn btn-primary flex items-center">
          <Plus size={18} className="mr-2" />
          Add Buyer
        </button>
      </div>

      {/* Content Table */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-slate-100 dark:border-dark-border overflow-hidden">
        {/* Table Toolbar */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-dark-border flex justify-between items-center bg-slate-50/50 dark:bg-dark-bg/20">
          <h2 className="text-md font-semibold text-slate-800 dark:text-white flex items-center">
            Registered Buyers
          </h2>
          <div className="flex items-center space-x-2">
            <TextField
              select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
            </TextField>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            Loading data...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-dark-border">
                  <th className="px-6 py-4 text-[12px] font-semibold text-primary uppercase tracking-wider">Buyer Details</th>
                  <th className="px-6 py-4 text-[12px] font-semibold text-primary uppercase tracking-wider">Code</th>
                  <th className="px-6 py-4 text-[12px] font-semibold text-primary uppercase tracking-wider">Associated Company</th>
                  <th className="px-6 py-4 text-[12px] font-semibold text-primary uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-[12px] font-semibold text-primary uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-dark-border/50">
                {buyers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 text-sm">
                      No records found. Click "Add" to create one.
                    </td>
                  </tr>
                ) : (
                  buyers.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-bg/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center font-bold mr-3">
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-md font-semibold text-slate-800 dark:text-slate-200">{item.name}</p>
                            <p className="text-[12px] text-[#e2148dc4] mt-0.5">{item.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                        <span className="bg-slate-100 dark:bg-dark-bg px-2 py-1 rounded text-xs">{item.code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.firm?.company?.name || item.firm?.name || '-'}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">{item.mobile || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2 transition-opacity">
                          <button onClick={() => openModal(item)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors" title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 transition-all modal_main">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 dark:border-dark-border max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/20 shrink-0">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                {editItem ? 'Edit' : 'Add'} Buyer
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 hover:bg-slate-100 dark:hover:bg-dark-bg rounded-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              <form id="firm-buyer-form" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <TextField required label="Buyer Code" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} />
                  <TextField required label="Buyer Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <TextField select required label="Select Company" value={formData.companyId || ''} onChange={e => setFormData({ ...formData, companyId: e.target.value })}>
                    <MenuItem value=""><em>Select a Company</em></MenuItem>
                    {companies.map(c => (
                      <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                    ))}
                  </TextField>
                  <TextField label="Branch Name" value={formData.branchName} onChange={e => setFormData({ ...formData, branchName: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <TextField label="GSTIN" value={formData.gst} onChange={e => setFormData({ ...formData, gst: e.target.value })} />
                  <TextField label="PAN Number" value={formData.pan} onChange={e => setFormData({ ...formData, pan: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <TextField label="State Code" value={formData.stateCode} onChange={e => setFormData({ ...formData, stateCode: e.target.value })} />
                  <TextField required type="email" label="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <TextField required label="Cell No1" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} />
                  <TextField label="Cell No 2" value={formData.mobile2} onChange={e => setFormData({ ...formData, mobile2: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <TextField label="Billing Address" multiline rows={2} value={formData.billingAddress} onChange={e => setFormData({ ...formData, billingAddress: e.target.value })} />
                  <TextField label="Shipping Address" multiline rows={2} value={formData.shippingAddress} onChange={e => setFormData({ ...formData, shippingAddress: e.target.value })} />
                </div>
              </form>
            </div>

            <div className="flex justify-end space-x-3 px-6 py-4 mt-auto border-t border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/20 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg shadow-sm transition-all">
                Cancel
              </button>
              <button type="submit" form="firm-buyer-form" className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-500 rounded-lg shadow-sm shadow-primary-500/30 transition-all">
                {editItem ? 'Save Changes' : 'Create Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteConfirmId}
        onConfirm={executeDelete}
        onCancel={() => setDeleteConfirmId(null)}
        title="Delete this buyer?"
        message="This will permanently remove the record from your system. This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default FirmBuyerManager;
