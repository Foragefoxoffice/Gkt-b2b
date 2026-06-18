import React, { useState, useEffect } from 'react';
import { getDesignsApi, createDesignApi, updateDesignApi, deleteDesignApi, getCategoriesApi, createCategoryApi, updateCategoryApi, deleteCategoryApi, getWeaversApi, createWeaverApi, updateWeaverApi, deleteWeaverApi, assignDesignToLoomApi } from '../Action/api';
import { useSelector } from 'react-redux';
import { Plus, Edit2, Trash2, Image as ImageIcon, Layers, Users, Package, Tag, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { TextField, MenuItem, Autocomplete, Chip } from '@mui/material';

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
  const [imageFiles, setImageFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);

  const handleViewDetails = (item) => {
    setViewItem(item);
    setIsViewModalOpen(true);
  };

  // Loom Management State
  const [isLoomModalOpen, setIsLoomModalOpen] = useState(false);
  const [selectedWeaver, setSelectedWeaver] = useState(null);

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
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 2MB`);
        return false;
      }
      return true;
    });

    setImageFiles(prev => [...prev, ...validFiles]);
    const newPreviews = validFiles.map(f => URL.createObjectURL(f));
    setPreviewUrls(prev => [...prev, ...newPreviews]);
    e.target.value = '';
  };

  const removeNewImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      const newUrls = [...prev];
      URL.revokeObjectURL(newUrls[index]);
      return newUrls.filter((_, i) => i !== index);
    });
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const openModal = (item = null) => {
    setEditItem(item);
    setImageFiles([]);
    setPreviewUrls([]);
    setExistingImages([]);

    if (item) {
      if (activeTab === 'weavers') {
        setFormData({ ...item, looms: item.looms ? item.looms.map(l => l.loomNo).join(', ') : '' });
      } else {
        setFormData(item);
      }

      if (activeTab === 'designs' && item.image) {
        setExistingImages(item.image.split(',').map(s => s.trim()).filter(Boolean));
      }
    } else {
      if (activeTab === 'designs') setFormData({ name: '', code: '', rate: '', availableStock: '', categoryId: '' });
      if (activeTab === 'categories') setFormData({ name: '', code: '' });
      if (activeTab === 'weavers') setFormData({ name: '', code: '', looms: '' });
    }
    setIsModalOpen(true);
  };

  const openLoomModal = (weaver) => {
    setSelectedWeaver(weaver);
    setIsLoomModalOpen(true);
  };

  const handleAssignDesign = async (loomId, valueString) => {
    try {
      let payload = { designId: null, assignedColor: null };
      if (valueString) {
        const val = JSON.parse(valueString);
        payload = { designId: val.id, assignedColor: val.color };
      }
      
      await assignDesignToLoomApi(selectedWeaver.id, loomId, payload);
      toast.success('Design assigned');
      fetchData();
      // Update local state for immediate feedback
      setSelectedWeaver(prev => ({
        ...prev,
        looms: prev.looms.map(l => l.id === loomId ? { ...l, designId: payload.designId, assignedColor: payload.assignedColor } : l)
      }));
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to assign design';
      // Clean up messy prisma messages
      if (msg.includes('Unique constraint failed')) {
        toast.error('This design is already assigned. It must be unique.');
      } else {
        toast.error(msg);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let payload = { ...formData };

      // If it's a design, we might have an image, so use FormData
      if (activeTab === 'designs') {
        const form = new FormData();
        Object.keys(formData).forEach(key => form.append(key, formData[key]));
        imageFiles.forEach(file => form.append('images', file));
        existingImages.forEach(url => form.append('existingImages', url));
        payload = form;
      }

      if (activeTab === 'weavers') {
        payload.looms = typeof payload.looms === 'string'
          ? payload.looms.split(',').map(s => s.trim()).filter(Boolean)
          : payload.looms;
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
        <button className={`flex items-center px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'designs' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`} onClick={() => setActiveTab('designs')}>
          <Package size={18} className="mr-2" />
          Designs
        </button>
        <button className={`flex items-center px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'weavers' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`} onClick={() => setActiveTab('weavers')}>
          <Users size={18} className="mr-2" />
          Weavers
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
                      <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Looms</th>
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
                                src={getImageUrl(item.image.split(',')[0].trim())}
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setSelectedImage(getImageUrl(item.image.split(',')[0].trim()))}
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
                          <td className="p-4 text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                              <span>{item.looms?.length || 0} Looms</span>
                              {(item.looms?.filter(l => l.designId)?.length || 0) > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium tracking-wide bg-green-100 text-green-700">
                                  {item.looms.filter(l => l.designId).length} Assigned
                                </span>
                              )}
                            </div>
                          </td>
                        </>
                      )}
                      <td className="p-4 text-right">
                        {activeTab === 'designs' && (
                          <button onClick={() => handleViewDetails(item)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg mr-2 transition-colors" title="View Details">
                            <Eye size={18} />
                          </button>
                        )}
                        {activeTab === 'weavers' && (
                          <button onClick={() => openLoomModal(item)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg mr-2 transition-colors" title="Manage Looms">
                            <Layers size={18} />
                          </button>
                        )}
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
                      <TextField required label="Design Code" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} />
                      <TextField required label="Design Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <TextField select required label="Category" value={formData.categoryId || ''} onChange={e => setFormData({ ...formData, categoryId: e.target.value })}>
                        <MenuItem value=""><em>Select Category</em></MenuItem>
                        {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                      </TextField>
                      <Autocomplete
                        multiple
                        freeSolo
                        options={['Red', 'Blue', 'Green', 'Yellow', 'Black', 'White', 'Pink', 'Purple', 'Orange', 'Grey', 'Brown', 'Navy', 'Maroon']}
                        value={formData.color ? formData.color.split(',').map(c => c.trim()).filter(Boolean) : []}
                        onChange={(e, newValue) => setFormData({ ...formData, color: newValue.join(', ') })}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip variant="outlined" size="small" label={option} {...getTagProps({ index })} key={index} />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Colors"
                            placeholder="Type and press enter..."
                          />
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-5">
                      <TextField required label="Rate (₹)" value={formatPrice(formData.rate)} onChange={e => handlePriceChange(e, 'rate')} />
                      <TextField type="number" label="GST %" value={formData.gstPercent} onChange={e => setFormData({ ...formData, gstPercent: e.target.value })} inputProps={{ step: "0.01" }} />
                      <TextField type="number" required label="Stock" value={formData.availableStock} onChange={e => setFormData({ ...formData, availableStock: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Images</label>
                      <div className="flex flex-col gap-4">
                        <input type="file" multiple onChange={handleFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 flex-1" accept="image/*" />
                        <div className="flex flex-wrap gap-4 mt-2">
                          {existingImages.map((url, index) => (
                            <div key={`existing-${index}`} className="relative w-16 h-16 shrink-0 rounded-lg border border-slate-200 dark:border-dark-border overflow-hidden">
                              <img src={getImageUrl(url)} alt="Preview" className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setSelectedImage(getImageUrl(url))} />
                              <button type="button" onClick={() => removeExistingImage(index)} className="absolute top-0.5 right-0.5 bg-white rounded-full p-0.5 shadow hover:bg-red-50 text-red-500">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                              </button>
                            </div>
                          ))}
                          {previewUrls.map((url, index) => (
                            <div key={`new-${index}`} className="relative w-16 h-16 shrink-0 rounded-lg border border-slate-200 dark:border-dark-border overflow-hidden">
                              <img src={url} alt="Preview" className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setSelectedImage(url)} />
                              <button type="button" onClick={() => removeNewImage(index)} className="absolute top-0.5 right-0.5 bg-white rounded-full p-0.5 shadow hover:bg-red-50 text-red-500">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : activeTab === 'categories' ? (
                  <div className="grid grid-cols-1 gap-5">
                    <TextField required label="Category Code" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} />
                    <TextField required label="Category Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5">
                    <TextField required label="Weaver Code" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} />
                    <TextField required label="Weaver Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">Loom Numbers (comma separated)</label>
                      <TextField
                        multiline
                        rows={3}
                        value={formData.looms || ''}
                        onChange={e => setFormData({ ...formData, looms: e.target.value })}
                        placeholder="e.g. 4001, 4002, 4003"
                      />
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

      {isLoomModalOpen && selectedWeaver && (
        <div className="fixed modal_main inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 dark:border-dark-border flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/20 shrink-0">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center">
                <Layers className="mr-2 text-primary-600" size={20} />
                Loom Assignments for {selectedWeaver.name}
              </h2>
              <button onClick={() => setIsLoomModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 hover:bg-slate-100 dark:hover:bg-dark-bg rounded-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {(!selectedWeaver.looms || selectedWeaver.looms.length === 0) ? (
                <div className="text-center p-8 text-slate-500">This weaver has no looms defined. Edit the weaver to add loom numbers.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(() => {
                    const designVariants = designs.flatMap(d => {
                      if (!d.color) return [{ ...d, _variantId: JSON.stringify({id: d.id, color: null}), _color: null }];
                      const colors = d.color.split(',').map(c => c.trim()).filter(Boolean);
                      if (colors.length === 0) return [{ ...d, _variantId: JSON.stringify({id: d.id, color: null}), _color: null }];
                      return colors.map(c => ({ ...d, _variantId: JSON.stringify({id: d.id, color: c}), _color: c }));
                    });
                    return selectedWeaver.looms.map(loom => (
                      <div key={loom.id} className="p-4 border border-slate-200 dark:border-dark-border rounded-xl bg-slate-50 dark:bg-dark-bg flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-700 dark:text-slate-200">Loom #{loom.loomNo}</span>
                          {loom.designId && (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-md font-medium">Assigned</span>
                          )}
                        </div>
                        <TextField
                          select
                          size="small"
                          label="Assigned Design"
                          value={loom.designId ? JSON.stringify({id: loom.designId, color: loom.assignedColor || null}) : ''}
                          onChange={(e) => handleAssignDesign(loom.id, e.target.value)}
                          fullWidth
                        >
                          <MenuItem value=""><em>None</em></MenuItem>
                          {designVariants.map(dv => (
                            <MenuItem key={dv._variantId} value={dv._variantId}>
                              {dv.code} - {dv.name} {dv._color ? `(${dv._color})` : ''}
                            </MenuItem>
                          ))}
                        </TextField>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>

            <div className="flex justify-end px-6 py-4 mt-auto border-t border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/20 shrink-0">
              <button type="button" onClick={() => setIsLoomModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg shadow-sm transition-all">
                Close
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
      {isViewModalOpen && viewItem && (
        <div className="fixed modal_main inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[55] p-4 transition-all">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 dark:border-dark-border flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/20 shrink-0">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center">
                <Eye className="mr-2 text-primary-600" size={20} />
                Design Details
              </h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 hover:bg-slate-100 dark:hover:bg-dark-bg rounded-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <div className="rounded-xl overflow-hidden bg-slate-100 dark:bg-dark-border border border-slate-200 dark:border-dark-border shadow-sm">
                    {viewItem.image ? (
                      <div className="flex flex-col gap-2">
                        {viewItem.image.split(',').map((img, idx) => (
                          <img key={idx} src={getImageUrl(img.trim())} alt={`${viewItem.name} ${idx + 1}`} className="w-full h-auto object-cover" />
                        ))}
                      </div>
                    ) : (
                      <div className="w-full aspect-square flex items-center justify-center text-slate-400 flex-col">
                        <ImageIcon size={40} className="mb-2 opacity-50" />
                        <span className="text-sm font-medium">No Image</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:w-2/3 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{viewItem.name}</h3>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{viewItem.code}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-5 pt-4 border-t border-slate-100 dark:border-dark-border">
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Category</p>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{viewItem.category?.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Color(s)</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {viewItem.color ? viewItem.color.split(',').map((c, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-dark-bg text-slate-700 dark:text-slate-300 text-xs rounded-md border border-slate-200 dark:border-dark-border">{c.trim()}</span>
                        )) : <span className="text-slate-400 italic text-sm">None</span>}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Rate</p>
                      <p className="font-bold text-primary-600 dark:text-primary-400 text-lg">₹{formatPrice(viewItem.rate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase mb-1">GST</p>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{viewItem.gstPercent}%</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Available Stock</p>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${viewItem.availableStock <= 0 ? 'bg-red-100 text-red-800' : viewItem.availableStock <= 20 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {viewItem.availableStock} Units in Stock
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end px-6 py-4 mt-auto border-t border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/20 shrink-0">
              <button type="button" onClick={() => setIsViewModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg shadow-sm transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignManager;
