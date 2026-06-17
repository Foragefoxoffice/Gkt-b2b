import React, { useState, useEffect } from 'react';
import { getDesignsApi, createDesignApi, updateDesignApi, deleteDesignApi, getCategoriesApi, createCategoryApi, updateCategoryApi, deleteCategoryApi, getWeaversApi, createWeaverApi, updateWeaverApi, deleteWeaverApi } from '../Action/api';
import { useSelector } from 'react-redux';
import { Plus, Edit2, Trash2, Image as ImageIcon, Layers, Users, Package, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const DesignManager = () => {
  const { token } = useSelector(state => state.auth);

  const [activeTab, setActiveTab] = useState('categories'); // designs, categories, weavers
  const [designs, setDesigns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [weavers, setWeavers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const [formData, setFormData] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const getImageUrl = (path) => {
    if (!path) return '';
    const cleanPath = path.replace(/\\/g, '/');
    return `http://localhost:5000${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'designs') {
        const [dRes, cRes, wRes] = await Promise.all([
          getDesignsApi(),
          getCategoriesApi(),
          getWeaversApi()
        ]);
        setDesigns(dRes.data.data);
        setCategories(cRes.data.data);
        setWeavers(wRes.data.data);
      } else if (activeTab === 'categories') {
        const res = await getCategoriesApi();
        setCategories(res.data.data);
      } else {
        const res = await getWeaversApi();
        setWeavers(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (e, field) => {
    // Allow digits and at most one decimal point
    let val = e.target.value.replace(/[^0-9.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) {
      val = parts[0] + '.' + parts.slice(1).join('');
    }
    setFormData({ ...formData, [field]: val });
  };

  const formatPrice = (val) => {
    if (!val) return '';
    const [intPart, decPart] = val.toString().split('.');
    const formattedInt = intPart.replace(/(\d)(?=(\d\d)+\d$)/g, "$1,");
    return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      e.target.value = '';
      setImageFile(null);
      setPreviewUrl(null);
      return;
    }
    setImageFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const openModal = (item = null) => {
    setEditItem(item);
    setImageFile(null);

    if (item) {
      setFormData(item);
      if (activeTab === 'designs' && item.image) {
        setPreviewUrl(getImageUrl(item.image));
      } else {
        setPreviewUrl(null);
      }
    } else {
      setPreviewUrl(null);
      if (activeTab === 'designs') setFormData({ name: '', code: '', rate: '', availableStock: '', categoryId: '', weaverId: '', loomNo: '' });
      if (activeTab === 'categories') setFormData({ name: '', code: '' });
      if (activeTab === 'weavers') setFormData({ name: '', code: '', loomNumber: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let payload = { ...formData };

      // If it's a design, we might have an image, so use FormData
      if (activeTab === 'designs') {
        const form = new FormData();
        Object.keys(formData).forEach(key => form.append(key, formData[key]));
        if (imageFile) form.append('image', imageFile);
        payload = form;
      }

      if (editItem) {
        if (activeTab === 'designs') await updateDesignApi(editItem.id, payload);
        else if (activeTab === 'categories') await updateCategoryApi(editItem.id, payload);
        else await updateWeaverApi(editItem.id, payload);
        toast.success('Updated successfully');
      } else {
        if (activeTab === 'designs') await createDesignApi(payload);
        else if (activeTab === 'categories') await createCategoryApi(payload);
        else await createWeaverApi(payload);
        toast.success('Created successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this?')) return;
    try {
      if (activeTab === 'designs') await deleteDesignApi(id);
      else if (activeTab === 'categories') await deleteCategoryApi(id);
      else await deleteWeaverApi(id);
      toast.success('Deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Deletion failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Design Management</h1>
        <button onClick={() => openModal()} className="btn btn-primary flex items-center">
          <Plus size={18} className="mr-2" />
          Add {activeTab === 'designs' ? 'Design' : activeTab === 'categories' ? 'Category' : 'Weaver'}
        </button>
      </div>

      <div className="flex space-x-2 border-b border-slate-200 dark:border-dark-border mb-6">
        <button className={`flex items-center px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'categories' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`} onClick={() => setActiveTab('categories')}>
          <Tag size={18} className="mr-2" />
          Categories
        </button>
        <button className={`flex items-center px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'weavers' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`} onClick={() => setActiveTab('weavers')}>
          <Users size={18} className="mr-2" />
          Weavers
        </button>
        <button className={`flex items-center px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'designs' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`} onClick={() => setActiveTab('designs')}>
          <Package size={18} className="mr-2" />
          Designs
        </button>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-slate-200 dark:border-dark-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-dark-bg border-b border-slate-200 dark:border-dark-border">
                  {activeTab === 'designs' ? (
                    <>
                      <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Image</th>
                      <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Code</th>
                      <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Design Name</th>
                      <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Category</th>
                      <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Rate</th>
                      <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Stock</th>
                      <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                    </>
                  ) : activeTab === 'categories' ? (
                    <>
                      <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Code</th>
                      <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Category Name</th>
                      <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                    </>
                  ) : (
                    <>
                      <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Code</th>
                      <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Weaver Name</th>
                      <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Loom No.</th>
                      <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'designs' ? designs : activeTab === 'categories' ? categories : weavers).length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-500">No data found.</td>
                  </tr>
                ) : (
                  (activeTab === 'designs' ? designs : activeTab === 'categories' ? categories : weavers).map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-bg/50">
                      {activeTab === 'designs' ? (
                        <>
                          <td className="p-4">
                            {item.image ? (
                              <img
                                src={getImageUrl(item.image)}
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setSelectedImage(getImageUrl(item.image))}
                              />
                            ) : (
                              <div className="w-12 h-12 bg-slate-100 dark:bg-dark-border rounded-md flex items-center justify-center text-slate-400">No Img</div>
                            )}
                          </td>
                          <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{item.code}</td>
                          <td className="p-4 text-slate-600 dark:text-slate-400">{item.name}</td>
                          <td className="p-4 text-slate-600 dark:text-slate-400">{item.category?.name || '-'}</td>
                          <td className="p-4 text-slate-600 dark:text-slate-400">₹{formatPrice(item.rate)}</td>
                          <td className="p-4 text-slate-600 dark:text-slate-400">{item.availableStock}</td>
                        </>
                      ) : activeTab === 'categories' ? (
                        <>
                          <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{item.code}</td>
                          <td className="p-4 text-slate-600 dark:text-slate-400">{item.name}</td>
                        </>
                      ) : (
                        <>
                          <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{item.code}</td>
                          <td className="p-4 text-slate-600 dark:text-slate-400">{item.name}</td>
                          <td className="p-4 text-slate-600 dark:text-slate-400">{item.loomNumber || '-'}</td>
                        </>
                      )}
                      <td className="p-4 text-right">
                        <button onClick={() => openModal(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg mr-2 transition-colors">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed modal_main inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 dark:border-dark-border flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/20 shrink-0">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                {editItem ? 'Edit' : 'Add'} {activeTab === 'designs' ? 'Design' : activeTab === 'categories' ? 'Category' : 'Weaver'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 hover:bg-slate-100 dark:hover:bg-dark-bg rounded-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="managerForm" onSubmit={handleSubmit} className="space-y-5">
                {activeTab === 'designs' ? (
                  <>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Design Code <span className="text-red-500">*</span></label>
                        <input type="text" required value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} className="input-field shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Design Name <span className="text-red-500">*</span></label>
                        <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="input-field shadow-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Category <span className="text-red-500">*</span></label>
                        <select required value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })} className="input-field shadow-sm">
                          <option value="">Select Category</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Color</label>
                        <input type="text" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} className="input-field shadow-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Rate (₹) <span className="text-red-500">*</span></label>
                        <input type="text" required value={formatPrice(formData.rate)} onChange={e => handlePriceChange(e, 'rate')} className="input-field shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">GST %</label>
                        <input type="number" step="0.01" value={formData.gstPercent} onChange={e => setFormData({ ...formData, gstPercent: e.target.value })} className="input-field shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Stock <span className="text-red-500">*</span></label>
                        <input type="number" required value={formData.availableStock} onChange={e => setFormData({ ...formData, availableStock: e.target.value })} className="input-field shadow-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Weaver</label>
                        <select
                          value={formData.weaverId || ''}
                          onChange={e => {
                            const val = e.target.value;
                            const selectedWeaver = weavers.find(w => w.id === parseInt(val));
                            setFormData({
                              ...formData,
                              weaverId: val,
                              loomNumber: selectedWeaver ? (selectedWeaver.loomNumber || '') : ''
                            });
                          }}
                          className="input-field shadow-sm"
                        >
                          <option value="">Select Weaver</option>
                          {weavers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Loom Number</label>
                        <input type="text" value={formData.loomNumber} onChange={e => setFormData({ ...formData, loomNumber: e.target.value })} className="input-field shadow-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Image</label>
                      <div className="flex items-center gap-4">
                        {previewUrl && (
                          <div
                            className="w-16 h-16 shrink-0 rounded-lg border border-slate-200 dark:border-dark-border overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setSelectedImage(previewUrl)}
                          >
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <input type="file" onChange={handleFileChange} className="input-field shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 flex-1" accept="image/*" />
                      </div>
                    </div>
                  </>
                ) : activeTab === 'categories' ? (
                  <div className="grid grid-cols-1 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Category Code <span className="text-red-500">*</span></label>
                      <input type="text" required value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} className="input-field shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Category Name <span className="text-red-500">*</span></label>
                      <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="input-field shadow-sm" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Weaver Code <span className="text-red-500">*</span></label>
                      <input type="text" required value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} className="input-field shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Weaver Name <span className="text-red-500">*</span></label>
                      <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="input-field shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Loom Number</label>
                      <input type="text" value={formData.loomNumber} onChange={e => setFormData({ ...formData, loomNumber: e.target.value })} className="input-field shadow-sm" />
                    </div>
                  </div>
                )}
              </form>
            </div>

            <div className="flex justify-end space-x-3 px-6 py-4 mt-auto border-t border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/20 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg shadow-sm transition-all">
                Cancel
              </button>
              <button type="submit" form="managerForm" className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-500 rounded-lg shadow-sm shadow-primary-500/30 transition-all">
                {editItem ? 'Save Changes' : 'Create Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="fixed modal_main inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 transition-all" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button onClick={() => setSelectedImage(null)} className="absolute -top-10 right-0 text-white hover:text-slate-300">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <img src={selectedImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-slate-700/50" onClick={e => e.stopPropagation()} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignManager;
