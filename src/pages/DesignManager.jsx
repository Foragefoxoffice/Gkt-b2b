import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getDesignsApi, createDesignApi, updateDesignApi, deleteDesignApi, getCategoriesApi, createCategoryApi, updateCategoryApi, deleteCategoryApi, getWeaversApi, createWeaverApi, updateWeaverApi, deleteWeaverApi, assignDesignToLoomApi } from '../Action/api';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Image as ImageIcon, Layers, Users, Package, Tag, Eye, Search, SlidersHorizontal, Archive, TrendingUp, TrendingDown, MoreHorizontal, ChevronLeft, ChevronRight, AlertTriangle, X, Loader2 } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { TextField, MenuItem, InputAdornment, Tooltip } from '@mui/material';
import ConfirmDialog from '../components/ConfirmDialog';
import ImageZoom from '../components/ImageZoom';
import Pagination from '../components/Pagination';
import imageCompression from 'browser-image-compression';
import { getColorSync } from 'colorthief';
import namer from 'color-namer';

const extractDominantColor = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const color = getColorSync(img);
          if (color) {
            const rgb = color.array();
            const result = namer(`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);
            let name = result.ntc[0].name; // ntc provides human readable names
            name = name.replace(/\b\w/g, l => l.toUpperCase());
            resolve(name);
          } else {
            resolve('');
          }
        } catch (e) {
          resolve('');
        }
      };
      img.onerror = () => resolve('');
      img.src = event.target.result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

const extractDominantColorUrl = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        const color = getColorSync(img);
        if (color) {
          const rgb = color.array();
          const result = namer(`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);
          let name = result.ntc[0].name;
          name = name.replace(/\b\w/g, l => l.toUpperCase());
          resolve(name);
        } else {
          resolve('');
        }
      } catch (e) {
        resolve('');
      }
    };
    img.onerror = () => resolve('');
    img.src = url;
  });
};

const DesignManager = () => {
  const { token } = useSelector(state => state.auth);
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('categories'); // designs, categories, weavers
  const [designs, setDesigns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [weavers, setWeavers] = useState([]);
  const [loading, setLoading] = useState(true);
  const alertedDesigns = useRef(new Set());

  useEffect(() => {
    if (activeTab === 'designs' && designs.length > 0) {
      const lowStockDesigns = designs.filter(d => (parseInt(d.availableStock) || 0) < 10);

      lowStockDesigns.forEach(d => {
        if (!alertedDesigns.current.has(d.id)) {
          toast.custom((t) => (
            <div
              className={`${t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-md w-full bg-white dark:bg-dark-card shadow-2xl rounded-2xl border-2 border-red-500 pointer-events-auto flex overflow-hidden`}
            >
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shadow-inner">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-md font-black text-red-700 dark:text-red-400">
                      Critical Stock Alert
                    </p>
                    <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                      Product <span className="font-bold text-slate-800 dark:text-white">{d.name} ({d.code})</span> is almost out of stock! Only <span className="font-black text-red-600 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded">{d.availableStock} units</span> left.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-dark-bg">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          ), {
            duration: 8000,
            position: 'top-right',
            id: `low-stock-${d.id}`
          });
          alertedDesigns.current.add(d.id);
        }
      });
    }
  }, [designs, activeTab]);

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
    <div className="card p-5 hover:shadow-md transition-shadow relative overflow-hidden group border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card rounded-2xl shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</h3>
        <div className="p-1.5 bg-slate-50 dark:bg-dark-bg rounded text-slate-400 border border-slate-100 dark:border-dark-border">
          <MoreHorizontal size={14} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-semibold text-slate-800 dark:text-white">{value}</p>
          {trend && (
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
          )}
        </div>
        {sparklineData && (
          <div className="opacity-80 group-hover:opacity-100 transition-opacity">
            <Sparkline color={color} data={sparklineData} />
          </div>
        )}
      </div>
    </div>
  );

  // Form State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setSelectedCategory('ALL');
    setSortBy('newest');
    setPage(1);
  }, [activeTab]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (debouncedSearchTerm !== searchTerm) {
        setDebouncedSearchTerm(searchTerm);
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearchTerm]);

  const filteredData = useMemo(() => {
    let data = [];
    if (activeTab === 'designs') data = [...designs];
    else if (activeTab === 'categories') data = [...categories];
    else data = [...weavers];

    // Client-side sorting on the current page data

    data.sort((a, b) => {
      if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '');
      if (activeTab === 'designs') {
        if (sortBy === 'price_asc') return (a.rate || 0) - (b.rate || 0);
        if (sortBy === 'price_desc') return (b.rate || 0) - (a.rate || 0);
      }
      return 0;
    });

    return data;
  }, [designs, categories, weavers, activeTab, searchTerm, selectedCategory, sortBy]);

  // Calculate Stats
  const sparkline1 = useMemo(() => [{ value: 40 }, { value: 30 }, { value: 45 }, { value: 50 }, { value: 35 }, { value: 60 }, { value: 70 }], []);
  const sparkline2 = useMemo(() => [{ value: 20 }, { value: 30 }, { value: 25 }, { value: 40 }, { value: 60 }, { value: 50 }, { value: 80 }], []);
  const sparkline3 = useMemo(() => [{ value: 70 }, { value: 60 }, { value: 50 }, { value: 40 }, { value: 55 }, { value: 45 }, { value: 30 }], []);
  const sparkline4 = useMemo(() => [{ value: 30 }, { value: 50 }, { value: 40 }, { value: 60 }, { value: 55 }, { value: 70 }, { value: 90 }], []);

  const stats = useMemo(() => {
    if (activeTab === 'designs') {
      const totalStock = designs.reduce((acc, d) => acc + (parseInt(d.availableStock) || 0), 0);
      const lowStock = designs.filter(d => (parseInt(d.availableStock) || 0) < 20).length;
      const totalValue = designs.reduce((acc, d) => acc + ((parseFloat(d.rate) || 0) * (parseInt(d.availableStock) || 0)), 0);
      return [
        { title: 'Total Designs', value: totalItems, trend: '+4.2%', isPositive: true, sparklineData: sparkline1, color: '#10b981' },
        { title: 'Total Stock', value: totalStock, trend: '+1.5%', isPositive: true, sparklineData: sparkline2, color: '#0ea5e9' },
        { title: 'Low Stock Items', value: lowStock, trend: '-2.1%', isPositive: false, sparklineData: sparkline3, color: '#f43f5e' },
        { title: 'Est. Stock Value', value: `₹${(totalValue >= 1000000 ? (totalValue / 1000000).toFixed(1) + 'M' : (totalValue / 1000).toFixed(1) + 'k')}`, trend: '+5.4%', isPositive: true, sparklineData: sparkline4, color: '#e2148d' }
      ];
    } else if (activeTab === 'weavers') {
      const totalLooms = weavers.reduce((acc, w) => acc + (w.loom ? w.loom.length : 0), 0);
      const assignedLooms = weavers.reduce((acc, w) => acc + (w.loom ? w.loom.filter(l => l.designId).length : 0), 0);
      const availableLooms = totalLooms - assignedLooms;
      return [
        { title: 'Total Weavers', value: totalItems, trend: '+2.1%', isPositive: true, sparklineData: sparkline1, color: '#10b981' },
        { title: 'Total Looms', value: totalLooms, trend: '+0.0%', isPositive: true, sparklineData: sparkline2, color: '#0ea5e9' },
        { title: 'Assigned Looms', value: assignedLooms, trend: '+15.2%', isPositive: true, sparklineData: sparkline4, color: '#e2148d' },
        { title: 'Available Looms', value: availableLooms, trend: '-5.1%', isPositive: false, sparklineData: sparkline3, color: '#f43f5e' }
      ];
    } else {
      return [
        { title: 'Total Categories', value: totalItems, trend: '+12.5%', isPositive: true, sparklineData: sparkline1, color: '#10b981' },
        { title: 'Active Categories', value: totalItems, trend: '+8.2%', isPositive: true, sparklineData: sparkline2, color: '#e2148d' },
      ];
    }
  }, [activeTab, designs, weavers, categories, sparkline1, sparkline2, sparkline3, sparkline4, totalItems]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const [formData, setFormData] = useState({});
  const [combinedImages, setCombinedImages] = useState([]);
  const [draggedImgIndex, setDraggedImgIndex] = useState(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const computedColors = useMemo(() => {
    return Array.from(new Set(combinedImages.map(img => img.color).map(c => c ? c.trim() : '')))
      .filter(Boolean);
  }, [combinedImages]);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [viewSliderIndex, setViewSliderIndex] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [highlightColor, setHighlightColor] = useState(null);

  const handleViewDetails = (item) => {
    setViewItem(item);
    setViewSliderIndex(0);
    setIsViewModalOpen(true);
  };

  // Loom Management State
  const [isLoomModalOpen, setIsLoomModalOpen] = useState(false);
  const [selectedWeaver, setSelectedWeaver] = useState(null);

  const getImageUrl = (path) => {
    if (!path) return '';
    const cleanPath = path.replace(/\\/g, '/');
    return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
  };

  const getVariantImage = (dv) => {
    if (!dv.image) return null;
    const imagesList = dv.image.split(',').map(img => img.trim()).filter(Boolean);
    if (imagesList.length === 0) return null;

    if (dv._color && dv.imageColorMap) {
      try {
        const colorMap = JSON.parse(dv.imageColorMap);
        if (Array.isArray(colorMap)) {
          const colorIndex = colorMap.findIndex(
            c => c && c.trim().toLowerCase() === dv._color.trim().toLowerCase()
          );
          if (colorIndex !== -1 && imagesList[colorIndex]) {
            return imagesList[colorIndex];
          }
        }
      } catch (e) { }
    }
    return imagesList[0];
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, page, limit, debouncedSearchTerm, selectedCategory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'designs') {
        const [dRes, cRes, wRes] = await Promise.all([
          getDesignsApi({
            page,
            limit,
            search: debouncedSearchTerm,
            categoryId: selectedCategory !== 'ALL' ? selectedCategory : undefined
          }),
          getCategoriesApi({ limit: 1000 }),
          getWeaversApi({ limit: 1000 })
        ]);
        setDesigns(dRes.data.data);
        setCategories(cRes.data.data);
        setWeavers(wRes.data.data);
        if (dRes.data.pagination) {
          setTotalPages(dRes.data.pagination.totalPages);
          setTotalItems(dRes.data.pagination.total);
        }
      } else if (activeTab === 'categories') {
        const res = await getCategoriesApi({ page, limit, search: debouncedSearchTerm });
        setCategories(res.data.data);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages);
          setTotalItems(res.data.pagination.total);
        }
      } else {
        const [wRes, dRes] = await Promise.all([
          getWeaversApi({ page, limit, search: debouncedSearchTerm }),
          getDesignsApi({ limit: 1000 })
        ]);
        setWeavers(wRes.data.data);
        setDesigns(dRes.data.data);
        if (wRes.data.pagination) {
          setTotalPages(wRes.data.pagination.totalPages);
          setTotalItems(wRes.data.pagination.total);
        }
      }
    } catch (err) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Listen for socket events to refresh list in real-time
    const handleUpdate = () => fetchData();
    window.addEventListener('inventoryUpdated', handleUpdate);
    return () => window.removeEventListener('inventoryUpdated', handleUpdate);
  }, []);

  useEffect(() => {
    if (location.state?.openDesignDetailsId && activeTab !== 'designs') {
      setActiveTab('designs');
    }
  }, [location.state?.openDesignDetailsId, activeTab]);

  useEffect(() => {
    if (location.state?.openDesignDetailsId && designs.length > 0 && activeTab === 'designs') {
      const designToOpen = designs.find(d => d.id === location.state.openDesignDetailsId);
      if (designToOpen) {
        if (location.state.highlightColor) {
          setHighlightColor(location.state.highlightColor);
        }
        handleViewDetails(designToOpen);
        // Clear state to avoid reopening on refresh
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state?.openDesignDetailsId, designs, activeTab, navigate, location.pathname, location.state?.highlightColor]);

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

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);

    const newImages = [];

    for (let i = 0; i < files.length; i++) {
      let file = files[i];
      if (file.size > 1024 * 1024) { // Compress if > 1MB
        try {
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          };
          const compressedFile = await imageCompression(file, options);
          file = new File([compressedFile], file.name, { type: compressedFile.type });
        } catch (error) {
          console.error("Error compressing image:", error);
          toast.error(`Failed to compress ${file.name}`);
        }
      }

      let autoColor = await extractDominantColor(file);

      newImages.push({
        id: `new-${i}-${Date.now()}`,
        type: 'new',
        file,
        url: URL.createObjectURL(file),
        color: autoColor
      });
    }

    setCombinedImages(prev => [...prev, ...newImages]);
    e.target.value = '';
  };

  const removeImage = (index) => {
    const imgToRemove = combinedImages[index];
    const keyToRemove = imgToRemove?.color || (imgToRemove ? ('__temp__' + imgToRemove.id) : null);
    if (keyToRemove) {
      setFormData(prev => {
        const newStocks = { ...prev.colorStocks };
        delete newStocks[keyToRemove];
        return { ...prev, colorStocks: newStocks };
      });
    }

    setCombinedImages(prev => {
      const newImages = [...prev];
      if (newImages[index].type === 'new') {
        URL.revokeObjectURL(newImages[index].url);
      }
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleDragStart = (e, index) => {
    setDraggedImgIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    if (draggedImgIndex !== null && draggedImgIndex !== index) {
      setDraggedOverIndex(index);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragLeave = (e, index) => {
    if (draggedOverIndex === index) {
      setDraggedOverIndex(null);
    }
  };

  const handleDrop = async (e, index) => {
    e.preventDefault();
    if (draggedImgIndex === null || draggedImgIndex === index) {
      setDraggedImgIndex(null);
      setDraggedOverIndex(null);
      return;
    }

    let items = [...combinedImages];
    const draggedItem = items[draggedImgIndex];
    items.splice(draggedImgIndex, 1);
    items.splice(index, 0, draggedItem);

    setCombinedImages(items);
    setDraggedImgIndex(null);
    setDraggedOverIndex(null);

    for (let i = 1; i < items.length; i++) {
      if (!items[i].color) {
        let autoColor = '';
        if (items[i].type === 'new') {
          autoColor = await extractDominantColor(items[i].file);
        } else {
          autoColor = await extractDominantColorUrl(getImageUrl(items[i].url));
        }
        if (autoColor) {
          setCombinedImages(prev => {
            const newItems = [...prev];
            const idx = newItems.findIndex(img => img.id === items[i].id);
            if (idx !== -1 && !newItems[idx].color) {
              newItems[idx] = { ...newItems[idx], color: autoColor };
            }
            return newItems;
          });
        }
      }
    }
  };

  const handleDragEnd = () => {
    setDraggedImgIndex(null);
    setDraggedOverIndex(null);
  };

  const openModal = (item = null) => {
    setEditItem(item);
    setCombinedImages([]);

    if (item) {
      if (activeTab === 'weavers') {
        setFormData({ ...item, loom: item.loom ? item.loom.map(l => l.loomNo).join(', ') : '' });
      } else if (activeTab === 'designs') {
        let parsedColorStocks = {};
        if (item.colorStock) {
          try {
            parsedColorStocks = JSON.parse(item.colorStock);
          } catch (e) { }
        }
        setFormData({ ...item, colorStocks: parsedColorStocks });
      } else {
        setFormData(item);
      }

      if (activeTab === 'designs' && item.image) {
        const exImages = item.image.split(',').map(s => s.trim()).filter(Boolean);
        let exColors = [];
        if (item.imageColorMap) {
          try {
            const parsedColors = JSON.parse(item.imageColorMap);
            exColors = Array.isArray(parsedColors) ? parsedColors : [];
          } catch (e) { }
        }
        const combined = exImages.map((url, idx) => ({
          id: `existing-${idx}-${Date.now()}`,
          type: 'existing',
          url,
          color: exColors[idx] || ''
        }));
        setCombinedImages(combined);
      }
    } else {
      if (activeTab === 'designs') setFormData({ name: '', code: '', rate: '', availableStock: '', categoryId: '', colorStocks: {} });
      if (activeTab === 'categories') setFormData({ name: '', code: '' });
      if (activeTab === 'weavers') setFormData({ name: '', code: '', loom: '' });
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
        loom: prev.loom.map(l => l.id === loomId ? { ...l, designId: payload.designId, assignedColor: payload.assignedColor } : l)
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
        const finalColorString = computedColors.join(', ');
        const appendedKeys = new Set();

        Object.keys(formData).forEach(key => {
          if (key === 'color') {
            form.append('color', finalColorString);
            appendedKeys.add('color');
          } else if (key === 'colorStocks') {
            const cleanStocks = {};
            Object.keys(formData[key] || {}).forEach(k => {
              if (!k.startsWith('__temp__')) {
                cleanStocks[k] = formData[key][k];
              }
            });
            form.append(key, JSON.stringify(cleanStocks));
            appendedKeys.add(key);
          } else {
            form.append(key, formData[key]);
            appendedKeys.add(key);
          }
        });
        if (!appendedKeys.has('color')) {
          form.append('color', finalColorString);
        }
        const mediaSequence = [];
        combinedImages.forEach((img, idx) => {
          if (img.type === 'existing') {
            form.append('existingImages', img.url);
            form.append('existingImageColors', img.color || '');
            mediaSequence.push('existing');
          } else {
            form.append('images', img.file);
            form.append('imageColors', img.color || '');
            mediaSequence.push('new');
          }
        });
        if (mediaSequence.length > 0) {
          form.append('mediaSequence', JSON.stringify(mediaSequence));
        }
        payload = form;
      }

      if (activeTab === 'weavers') {
        payload.loom = typeof payload.loom === 'string'
          ? payload.loom.split(',').map(s => s.trim()).filter(Boolean)
          : payload.loom;
        delete payload.looms;
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
      const msg = err.response?.data?.message || 'Operation failed';
      if (msg.includes('Unique constraint failed')) {
        toast.error('A record with this code already exists. Please use a unique code.');
      } else {
        toast.error(msg);
      }
    }
  };

  const handleDelete = (id) => {
    setDeleteConfirmId(id);
  };

  const executeDelete = async () => {
    const id = deleteConfirmId;
    setDeleteConfirmId(null);
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
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">Design Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage categories, designs, and weavers</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary flex items-center shadow-sm">
          <Plus size={18} className="mr-2" />
          Add {activeTab === 'designs' ? 'Design' : activeTab === 'categories' ? 'Category' : 'Weaver'}
        </button>
      </div>

      <div className="bg-white dark:bg-dark-card p-1.5 rounded-xl inline-flex mb-0 shadow-sm border border-slate-100 dark:border-dark-border">
        <button className={`flex items-center px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${activeTab === 'categories' ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-dark-bg'}`} onClick={() => setActiveTab('categories')}>
          <Tag size={18} className="mr-2" /> Categories
        </button>
        <button className={`flex items-center px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${activeTab === 'designs' ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-dark-bg'}`} onClick={() => setActiveTab('designs')}>
          <Package size={18} className="mr-2" /> Designs
        </button>
        <button className={`flex items-center px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${activeTab === 'weavers' ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-dark-bg'}`} onClick={() => setActiveTab('weavers')}>
          <Users size={18} className="mr-2" /> Weavers
        </button>
      </div>

      {/* Stats Section */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${stats.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-6 mb-6`}>
        {stats.map((stat, idx) => (
          <KPICard key={idx} {...stat} />
        ))}
      </div>

      {/* Advanced Filters */}
      <div className="bg-white dark:bg-dark-card p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-dark-border mb-6">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center mb-6">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-medium">
            <SlidersHorizontal size={18} className="text-primary-600" /> Filters & Sorting
          </div>
          <div className="w-full lg:w-96">
            <TextField
              fullWidth
              size="small"
              placeholder={`Search ${activeTab} by name or code...`}
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === 'designs' && (
            <TextField
              select
              fullWidth
              size="small"
              label="Category"
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
            >
              <MenuItem value="ALL">All Categories</MenuItem>
              {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
          )}

          <TextField
            select
            fullWidth
            size="small"
            label="Sort By"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <MenuItem value="newest">Newest First</MenuItem>
            <MenuItem value="name_asc">Name (A - Z)</MenuItem>
            <MenuItem value="name_desc">Name (Z - A)</MenuItem>
            {activeTab === 'designs' && [
              <MenuItem key="pa" value="price_asc">Price (Low to High)</MenuItem>,
              <MenuItem key="pd" value="price_desc">Price (High to Low)</MenuItem>
            ]}
          </TextField>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-slate-200 dark:border-dark-border overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-500 min-h-[300px]">
            <Loader2 className="w-10 h-10 animate-spin text-primary-600 mb-4" />
            <p className="text-slate-600 dark:text-slate-400 font-medium text-lg">Loading data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/50">
                <tr>
                  {activeTab === 'designs' ? (
                    <>
                      <th className="px-6 py-4 text-md font-medium text-slate-600 dark:text-slate-400">Image</th>
                      <th className="px-6 py-4 text-md font-medium text-slate-600 dark:text-slate-400">Code</th>
                      <th className="px-6 py-4 text-md font-medium text-slate-600 dark:text-slate-400">Design Name</th>
                      <th className="px-6 py-4 text-md font-medium text-slate-600 dark:text-slate-400">Category</th>
                      <th className="px-6 py-4 text-md font-medium text-slate-600 dark:text-slate-400">Rate</th>
                      <th className="px-6 py-4 text-md font-medium text-slate-600 dark:text-slate-400">Stock</th>
                      <th className="px-6 py-4 text-md font-medium text-slate-600 dark:text-slate-400 text-right">Actions</th>
                    </>
                  ) : activeTab === 'categories' ? (
                    <>
                      <th className="px-6 py-4 text-md font-medium text-slate-600 dark:text-slate-400 w-32">Code</th>
                      <th className="px-6 py-4 text-md font-medium text-slate-600 dark:text-slate-400">Category Name</th>
                      <th className="px-6 py-4 text-md font-medium text-slate-600 dark:text-slate-400 text-right">Actions</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4 text-md font-medium text-slate-600 dark:text-slate-400 w-32">Code</th>
                      <th className="px-6 py-4 text-md font-medium text-slate-600 dark:text-slate-400">Weaver Name</th>
                      <th className="px-6 py-4 text-md font-medium text-slate-600 dark:text-slate-400">Looms</th>
                      <th className="px-6 py-4 text-md font-medium text-slate-600 dark:text-slate-400 text-right">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-16 text-center">
                      <Archive className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                      <p className="text-slate-600 dark:text-slate-300 text-lg font-medium">No records found</p>
                      <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Try adjusting your filters or search terms.</p>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                      {activeTab === 'designs' ? (
                        <>
                          <td className="px-6 py-3">
                            <div className="flex items-center">
                              <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-dark-bg overflow-hidden border border-slate-200 dark:border-dark-border flex-shrink-0 cursor-pointer shadow-sm" onClick={() => item.image && setSelectedImage(getImageUrl(item.image.split(',')[0].trim()))}>
                                {item.image ? (
                                  <img src={getImageUrl(item.image.split(',')[0].trim())} alt={item.name} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50">NO IMG</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700">{item.code}</span>
                          </td>
                          <td className="px-6 py-3 font-semibold text-slate-800 dark:text-white text-sm">{item.name}</td>
                          <td className="px-6 py-3">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50">
                              {item.designcategory?.name || 'Uncategorized'}
                            </span>
                          </td>
                          <td className="px-6 py-3 font-bold text-emerald-600 dark:text-emerald-400 text-sm">₹{formatPrice(item.rate)}</td>
                          <td className="px-6 py-3">
                            <div className="flex flex-col justify-center">
                              <span className="font-bold text-slate-800 dark:text-white">{item.availableStock} <span className="font-medium text-slate-500 text-xs">units</span></span>
                              {item.availableStock < 10 && <span className="text-[10px] text-red-500 font-bold mt-0.5 uppercase tracking-wide">Low Stock</span>}
                            </div>
                          </td>
                        </>
                      ) : activeTab === 'categories' ? (
                        <>
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700">{item.code}</span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white text-sm">{item.name}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700">{item.code}</span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white text-sm">{item.name}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-3">
                              <span className="font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded text-xs border border-slate-200 dark:border-slate-700">
                                {item.loom?.length || 0} Looms
                              </span>
                              {(item.loom?.filter(l => l.designId)?.length || 0) > 0 && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold tracking-wide bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                                  {item.loom.filter(l => l.designId).length} Assigned
                                </span>
                              )}
                            </div>
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          {activeTab === 'designs' && (
                            <button onClick={() => handleViewDetails(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors" title="View Details">
                              <Eye size={18} />
                            </button>
                          )}
                          {activeTab === 'weavers' && (
                            <button onClick={() => openLoomModal(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors" title="Manage Looms">
                              <Layers size={18} />
                            </button>
                          )}
                          <button onClick={() => openModal(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Edit">
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Delete">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {totalPages > 0 && (
              <Pagination
                page={page}
                setPage={setPage}
                totalPages={totalPages}
                limit={limit}
                setLimit={setLimit}
                totalItems={totalItems}
                itemName={activeTab}
              />
            )}
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
                      <TextField required label="Rate (₹)" value={formatPrice(formData.rate)} onChange={e => handlePriceChange(e, 'rate')} />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <TextField type="number" label="GST %" value={formData.gstPercent} onChange={e => setFormData({ ...formData, gstPercent: e.target.value })} inputProps={{ step: "0.01" }} />
                      <TextField label="Material" value={formData.material || ''} onChange={e => setFormData({ ...formData, material: e.target.value })} />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Images</label>
                      <div className="flex flex-col gap-4">
                        <input type="file" multiple onChange={handleFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 flex-1" accept="image/*" />
                        <div className="flex flex-wrap gap-4 mt-2">
                          {combinedImages.map((img, index) => (
                            <div
                              key={img.id}
                              className={`flex flex-col gap-2 w-32 shrink-0 cursor-grab active:cursor-grabbing transition-transform ${draggedOverIndex === index ? 'scale-105 opacity-80 border border-dashed border-primary-500 rounded-lg' : ''}`}
                              draggable
                              onDragStart={(e) => handleDragStart(e, index)}
                              onDragEnter={(e) => handleDragEnter(e, index)}
                              onDragOver={handleDragOver}
                              onDragLeave={(e) => handleDragLeave(e, index)}
                              onDrop={(e) => handleDrop(e, index)}
                              onDragEnd={handleDragEnd}
                            >
                              <div className="relative w-32 h-48 rounded-lg border border-slate-200 dark:border-dark-border overflow-hidden bg-slate-50 dark:bg-dark-bg">
                                <img src={img.type === 'existing' ? getImageUrl(img.url) : img.url} alt="Preview" className="w-full h-full object-contain cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setSelectedImage(img.type === 'existing' ? getImageUrl(img.url) : img.url)} draggable={false} />
                                {index === 0 && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] font-bold text-center py-0.5 uppercase tracking-wider pointer-events-none">Front</div>
                                )}
                                <button type="button" onClick={() => removeImage(index)} className="absolute top-0.5 right-0.5 bg-white rounded-full p-0.5 shadow hover:bg-red-50 text-red-500">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                              </div>
                              {index > 0 && (
                                <div className="flex items-center w-full mt-1.5 bg-white dark:bg-dark-bg border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 shadow-sm transition-all group">
                                  <input
                                    required
                                    type="number"
                                    placeholder="Qty"
                                    value={
                                      (() => {
                                        const key = img.color || ('__temp__' + img.id);
                                        return formData.colorStocks?.[key] !== undefined ? formData.colorStocks[key] : '';
                                      })()
                                    }
                                    onChange={(e) => {
                                      const key = img.color || ('__temp__' + img.id);
                                      const val = e.target.value;
                                      setFormData(prev => ({
                                        ...prev,
                                        colorStocks: { ...prev.colorStocks, [key]: val === '' ? '' : parseInt(val) }
                                      }));
                                    }}
                                    className="w-[30%] text-xs px-2.5 py-2 outline-none bg-transparent placeholder-slate-400 text-slate-700 dark:text-slate-300 pointer-events-auto [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <div className="w-px h-5 bg-slate-200 dark:bg-slate-700"></div>
                                  <input
                                    required
                                    type="text"
                                    placeholder="Color"
                                    value={img.color || ''}
                                    onChange={(e) => {
                                      const oldKey = img.color || ('__temp__' + img.id);
                                      const newColor = e.target.value;
                                      const newKey = newColor || ('__temp__' + img.id);
                                      const newImages = [...combinedImages];
                                      newImages[index].color = newColor;
                                      setCombinedImages(newImages);

                                      setFormData(prev => {
                                        const newStocks = { ...prev.colorStocks };
                                        const stockVal = newStocks[oldKey];
                                        delete newStocks[oldKey];
                                        if (stockVal !== undefined) {
                                          newStocks[newKey] = stockVal;
                                        }
                                        return { ...prev, colorStocks: newStocks };
                                      });
                                    }}
                                    className="w-[70%] text-xs px-2.5 py-2 outline-none bg-transparent placeholder-slate-400 text-slate-700 dark:text-slate-300 pointer-events-auto"
                                  />
                                </div>
                              )}
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
                        value={formData.loom || ''}
                        onChange={e => setFormData({ ...formData, loom: e.target.value })}
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
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-100 dark:border-dark-border flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/20 shrink-0">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <Layers className="mr-2 text-primary-600" size={20} />
                Loom Assignments for {selectedWeaver.name}
              </h2>
              <button onClick={() => setIsLoomModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 hover:bg-slate-100 dark:hover:bg-dark-bg rounded-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {(!selectedWeaver.loom || selectedWeaver.loom.length === 0) ? (
                <div className="text-center p-8 text-slate-500">This weaver has no looms defined. Edit the weaver to add loom numbers.</div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(() => {
                      const designVariants = designs.flatMap(d => {
                        if (!d.color) return [{ ...d, _variantId: JSON.stringify({ id: d.id, color: null }), _color: null }];
                        const colors = d.color.split(',').map(c => c.trim()).filter(Boolean);
                        if (colors.length === 0) return [{ ...d, _variantId: JSON.stringify({ id: d.id, color: null }), _color: null }];
                        return colors.map(c => ({ ...d, _variantId: JSON.stringify({ id: d.id, color: c }), _color: c }));
                      });
                      return selectedWeaver.loom.map(loom => (
                        <div key={loom.id} className="p-4 border border-slate-200 dark:border-dark-border rounded-xl bg-slate-50 dark:bg-dark-bg flex flex-col gap-3">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-slate-700 dark:text-slate-200">Loom #{loom.loomNo}</span>
                            {loom.designId && (
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-md font-medium">Assigned</span>
                            )}
                          </div>
                          <TextField
                            select
                            size="small"
                            label="Assigned Design"
                            value={loom.designId ? JSON.stringify({ id: loom.designId, color: loom.assignedColor || null }) : ''}
                            onChange={(e) => handleAssignDesign(loom.id, e.target.value)}
                            fullWidth
                          >
                            <MenuItem value=""><em>None</em></MenuItem>
                            {designVariants.map(dv => (
                              <MenuItem key={dv._variantId} value={dv._variantId} className="!p-0">
                                <Tooltip
                                  title={
                                    dv.image ? (
                                      <div className="p-2 flex flex-col items-center bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 w-48">
                                        <img
                                          src={getImageUrl(getVariantImage(dv))}
                                          alt={dv.name}
                                          className="w-full aspect-[3/4] object-cover rounded-lg shadow-sm border border-slate-200 dark:border-slate-700"
                                        />
                                        <p className="mt-2 text-slate-800 dark:text-slate-100 text-xs font-bold text-center leading-tight">
                                          {dv.name}
                                        </p>
                                        {dv._color && (
                                          <span className="mt-1.5 px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded-full border border-indigo-100 dark:border-indigo-900/50">
                                            {dv._color}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="p-2 text-xs text-slate-400 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 shadow-md">
                                        No image available
                                      </div>
                                    )
                                  }
                                  placement="right"
                                  slotProps={{
                                    tooltip: {
                                      sx: {
                                        backgroundColor: 'transparent',
                                        boxShadow: 'none',
                                        padding: 0,
                                      }
                                    }
                                  }}
                                >
                                  <div className="w-full h-full px-2 py-1">
                                    {dv.code} - {dv.name} {dv._color ? `(${dv._color})` : ''}
                                  </div>
                                </Tooltip>
                              </MenuItem>
                            ))}
                          </TextField>
                        </div>
                      ));
                    })()}
                  </div>

                  {selectedWeaver.loom.some(l => l.designId) && (
                    <div className="pt-6 border-t border-slate-200 dark:border-dark-border">
                      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <ImageIcon size={16} className="text-primary-600" /> Assigned Designs Gallery (by Loom)
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                        {selectedWeaver.loom
                          .filter(l => l.designId)
                          .map(loom => {
                            const design = designs.find(d => d.id === loom.designId);
                            if (!design) return null;
                            const dv = {
                              ...design,
                              _color: loom.assignedColor
                            };
                            const imgPath = getVariantImage(dv);

                            return (
                              <div key={loom.id} className="flex flex-col items-center bg-slate-50 dark:bg-dark-bg p-2 rounded-xl border border-slate-200 dark:border-dark-border w-full shadow-sm hover:shadow-md transition-shadow relative">
                                <div className="absolute top-1.5 left-1.5 bg-primary-600 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-md shadow-sm uppercase tracking-wider z-10">
                                  Loom #{loom.loomNo}
                                </div>
                                <div className="w-full aspect-[3/4] rounded-lg overflow-hidden border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card mt-6">
                                  {imgPath ? (
                                    <img
                                      src={getImageUrl(imgPath)}
                                      alt={`Loom ${loom.loomNo}`}
                                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                      onClick={() => setSelectedImage(getImageUrl(imgPath))}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase">No Img</div>
                                  )}
                                </div>
                                <div className="mt-2 text-center w-full">
                                  <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate" title={design.code}>
                                    {design.code}
                                  </div>
                                  {loom.assignedColor && (
                                    <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate mt-0.5" title={loom.assignedColor}>
                                      {loom.assignedColor}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
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
            <ImageZoom
              src={selectedImage}
              alt="Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-slate-700/50"
              onClick={e => e.stopPropagation()}
            />
          </div>
        </div>
      )}
      <AnimatePresence>
        {isViewModalOpen && viewItem && (
          <div className="fixed modal_main inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[55] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 dark:border-dark-border flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/20 shrink-0">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center">
                  <Eye className="mr-2 text-primary-600" size={20} />
                  Design Details
                </h2>
                <button onClick={() => { setIsViewModalOpen(false); setHighlightColor(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 hover:bg-slate-100 dark:hover:bg-dark-bg rounded-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <div className="flex flex-col gap-6">

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 dark:bg-dark-bg p-5 rounded-xl border border-slate-200 dark:border-dark-border">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{viewItem.name}</h3>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-1">{viewItem.code}</p>
                    </div>
                    <div className="flex gap-6">
                      <div className="text-right">
                        <p className="text-xs text-slate-500 font-semibold uppercase mb-0.5">Rate</p>
                        <p className="font-bold text-primary-600 dark:text-primary-400 text-xl">₹{formatPrice(viewItem.rate)}</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-500 font-semibold uppercase mb-0.5">GST</p>
                        <p className="font-medium text-slate-800 dark:text-slate-200 text-lg">{viewItem.gstPercent}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-dark-card p-3 rounded-xl border border-slate-100 dark:border-dark-border shadow-sm flex flex-col justify-center gap-2">
                      <div className="flex justify-between items-center border-b border-slate-50 dark:border-dark-border pb-3">
                        <span className="text-xs text-slate-500 font-semibold uppercase">Category</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm bg-slate-50 dark:bg-dark-bg px-2.5 py-1 rounded-md border border-slate-100 dark:border-slate-800">{viewItem.designcategory?.name || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center pt-0">
                        <span className="text-xs text-slate-500 font-semibold uppercase">Stock</span>
                        <span className={`inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-bold shadow-sm ${viewItem.availableStock <= 0 ? 'bg-red-50 text-red-700 border border-red-200' : viewItem.availableStock <= 20 ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                          {viewItem.availableStock} Units
                        </span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-dark-card p-3 rounded-xl border border-slate-100 dark:border-dark-border shadow-sm flex flex-col justify-center">
                      <p className="text-xs text-slate-500 font-semibold uppercase mb-3">Color(s)</p>
                      <div className="flex flex-wrap gap-2">
                        {viewItem.color ? viewItem.color.split(',').map((c, i) => (
                          <span key={i} className="px-3 py-1.5 bg-slate-50 dark:bg-dark-bg text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">{c.trim()}</span>
                        )) : <span className="text-slate-400 italic text-sm">None</span>}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                      <ImageIcon size={18} className="text-primary-500" /> Design Images
                    </h4>
                    <div className="rounded-xl overflow-hidden bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border shadow-sm p-3">
                      {viewItem.image ? (
                        (() => {
                          const images = viewItem.image.split(',').map(img => img.trim()).filter(Boolean);
                          let colors = [];
                          if (viewItem.imageColorMap) {
                            try {
                              const parsedColors = JSON.parse(viewItem.imageColorMap);
                              colors = Array.isArray(parsedColors) ? parsedColors : [];
                            } catch (e) { }
                          }

                          return (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
                              {images.map((img, idx) => {
                                const isHighlighted = highlightColor && colors[idx] && colors[idx].toLowerCase().trim() === highlightColor.toLowerCase().trim();

                                return (
                                  <div
                                    key={idx}
                                    className={`relative aspect-[3/4] overflow-hidden rounded-lg border bg-white dark:bg-dark-card transition-all group cursor-pointer ${isHighlighted ? 'ring-2 ring-[#e2148d] shadow-xl border-[#e2148d]/50 scale-[1.02] z-10' : 'border-slate-200 dark:border-dark-border shadow-sm hover:shadow-md'}`}
                                    onClick={() => setSelectedImage(getImageUrl(img))}
                                  >
                                    <img
                                      src={getImageUrl(img)}
                                      alt={`${viewItem.name} ${idx + 1}`}
                                      className={`w-full h-full object-cover transition-transform duration-300 ${!isHighlighted ? 'group-hover:scale-105' : ''}`}
                                    />
                                    {colors[idx] && (
                                      <div className={`absolute bottom-2 left-2 backdrop-blur-sm text-[10px] font-semibold px-2 py-1 rounded-md uppercase tracking-wider pointer-events-none shadow-sm ${isHighlighted ? 'bg-[#e2148d] text-white border border-[#e2148d]/50' : 'bg-black/60 text-white'}`}>
                                        {colors[idx]}
                                      </div>
                                    )}
                                    {isHighlighted && (
                                      <div className="absolute top-2 right-2 bg-[#e2148d] text-white rounded-full p-1 shadow-lg animate-pulse">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()
                      ) : (
                        <div className="w-full h-48 flex items-center justify-center text-slate-400 flex-col bg-slate-100 dark:bg-dark-border rounded-lg">
                          <ImageIcon size={40} className="mb-2 opacity-50" />
                          <span className="text-sm font-medium">No Image</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end px-6 py-4 mt-auto border-t border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/20 shrink-0">
                <button type="button" onClick={() => { setIsViewModalOpen(false); setHighlightColor(null); }} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg shadow-sm transition-all">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!deleteConfirmId}
        onConfirm={executeDelete}
        onCancel={() => setDeleteConfirmId(null)}
        title={`Delete this ${activeTab === 'designs' ? 'design' : activeTab === 'categories' ? 'category' : 'weaver'}?`}
        message="This will permanently remove the record from your system. This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default DesignManager;
