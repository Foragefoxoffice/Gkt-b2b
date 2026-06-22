import React, { useState, useEffect } from 'react';
import { getTransportersApi, createTransporterApi, updateTransporterApi, deleteTransporterApi } from '../Action/api';
import { Plus, Edit2, Trash2, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { TextField } from '@mui/material';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';

const TransporterManager = () => {
  const [transporters, setTransporters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(10);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '', mobile: '', email: '', address: '', gstNumber: ''
  });

  useEffect(() => {
    fetchTransporters();
  }, [page, limit]);

  const fetchTransporters = async () => {
    setLoading(true);
    try {
      const res = await getTransportersApi({ page, limit });
      if (res.data.success) {
        setTransporters(res.data.data);
        if (res.data.pagination) {
           setTotalPages(res.data.pagination.totalPages);
           setTotalItems(res.data.pagination.total || 0);
        }
      }
    } catch (err) {
      toast.error('Failed to fetch transporters');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openModal = (item = null) => {
    setEditItem(item);
    if (item) {
      setFormData({
        name: item.name || '',
        mobile: item.mobile || '',
        email: item.email || '',
        address: item.address || '',
        gstNumber: item.gstNumber || ''
      });
    } else {
      setFormData({ name: '', mobile: '', email: '', address: '', gstNumber: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await updateTransporterApi(editItem.id, formData);
        toast.success('Transporter updated successfully');
      } else {
        await createTransporterApi(formData);
        toast.success('Transporter created successfully');
      }
      setIsModalOpen(false);
      fetchTransporters();
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
      await deleteTransporterApi(id);
      toast.success('Transporter deleted successfully');
      fetchTransporters();
    } catch (err) {
      toast.error('Deletion failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-white flex items-center"><Truck size={24} className="mr-2 dark:text-primary-500 text-primary-600" />Transporter Management</h1>
        <button onClick={() => openModal()} className="btn btn-primary flex items-center">
          <Plus size={18} className="mr-2" />
          Add Transporter
        </button>
      </div>

      {/* Content Table */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-slate-100 dark:border-dark-border overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-dark-border flex justify-between items-center bg-slate-50/50 dark:bg-dark-bg/20">
          <h2 className="text-md font-semibold text-slate-800 dark:text-white flex items-center">
            Registered Transporters
          </h2>
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
                  <th className="px-6 py-4 text-[12px] font-semibold text-primary uppercase tracking-wider">
                    Transporter Details
                  </th>
                  <th className="px-6 py-4 text-[12px] font-semibold text-primary uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-[12px] font-semibold text-primary uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-4 text-[12px] font-semibold text-primary uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-dark-border/50">
                {transporters.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400 text-sm">
                      No transporters found. Click "Add Transporter" to create one.
                    </td>
                  </tr>
                ) : (
                  transporters.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-bg/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center font-bold mr-3 overflow-hidden shrink-0">
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-md font-semibold text-slate-800 dark:text-slate-200">{item.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.email && <span className="text-[12px] text-[#e2148dc4]">{item.email}</span>}
                              {item.email && item.gstNumber && <span className="text-[10px] text-slate-300">|</span>}
                              {item.gstNumber && (
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                  GST: {item.gstNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                        {item.mobile || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                        {item.address || '-'}
                      </td>
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

            {/* Pagination Controls */}
            {totalPages > 0 && (
              <Pagination 
                page={page} 
                setPage={setPage} 
                totalPages={totalPages} 
                limit={limit} 
                setLimit={setLimit} 
                totalItems={totalItems} 
                itemName="transporters" 
              />
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed modal_main inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 transition-all">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-dark-border max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/20 shrink-0">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                {editItem ? 'Edit Transporter' : 'Add Transporter'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 hover:bg-slate-100 dark:hover:bg-dark-bg rounded-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              <form id="transporter-form" onSubmit={handleSubmit} className="space-y-5">
                <TextField
                  required
                  fullWidth
                  label="Transporter Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
                <TextField
                  required
                  fullWidth
                  label="Mobile Number"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                />
                <TextField
                  fullWidth
                  type="email"
                  label="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                <TextField
                  fullWidth
                  label="GST No - Transporter ID"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleInputChange}
                />
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  multiline
                  rows={3}
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </form>
            </div>

            <div className="flex justify-end space-x-3 px-6 py-4 mt-auto border-t border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/20 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg shadow-sm transition-all">
                Cancel
              </button>
              <button type="submit" form="transporter-form" className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-500 rounded-lg shadow-sm shadow-primary-500/30 transition-all">
                {editItem ? 'Save Changes' : 'Create Transporter'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteConfirmId}
        onConfirm={executeDelete}
        onCancel={() => setDeleteConfirmId(null)}
        title="Delete this transporter?"
        message="This will permanently remove the transporter from your records. This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default TransporterManager;
