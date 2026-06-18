import React, { useState, useEffect } from 'react';
import { getDesignsApi, getCategoriesApi } from '../Action/api';
import { useSelector } from 'react-redux';
import { Package, AlertTriangle, TrendingUp, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { TextField, MenuItem, InputAdornment } from '@mui/material';

const InventoryDashboard = () => {
  const { token } = useSelector(state => state.auth);
  
  const [designs, setDesigns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('ALL'); // ALL, LOW, OUT

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [designsRes, catRes] = await Promise.all([
        getDesignsApi(),
        getCategoriesApi()
      ]);
      setDesigns(designsRes.data.data);
      setCategories(catRes.data.data);
    } catch (err) {
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const lowStockThreshold = 20;

  const filteredDesigns = designs.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory ? d.categoryId === parseInt(selectedCategory) : true;
    let matchStock = true;
    if (stockFilter === 'LOW') matchStock = d.availableStock > 0 && d.availableStock <= lowStockThreshold;
    if (stockFilter === 'OUT') matchStock = d.availableStock <= 0;
    
    return matchSearch && matchCat && matchStock;
  });

  const totalStock = designs.reduce((acc, d) => acc + d.availableStock, 0);
  const lowStockCount = designs.filter(d => d.availableStock > 0 && d.availableStock <= lowStockThreshold).length;
  const outOfStockCount = designs.filter(d => d.availableStock <= 0).length;

  const getImageUrl = (path) => {
    if (!path) return '';
    const cleanPath = path.replace(/\\/g, '/');
    return `http://localhost:5000${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
          <Package className="mr-3" /> Inventory Dashboard
        </h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-sm border border-slate-200 dark:border-dark-border flex items-center">
          <div className="p-4 bg-blue-100 text-blue-600 rounded-lg mr-4">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Units in Stock</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{totalStock}</h3>
          </div>
        </div>
        
        <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-sm border border-slate-200 dark:border-dark-border flex items-center">
          <div className="p-4 bg-yellow-100 text-yellow-600 rounded-lg mr-4">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Low Stock Items</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{lowStockCount}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-sm border border-slate-200 dark:border-dark-border flex items-center">
          <div className="p-4 bg-red-100 text-red-600 rounded-lg mr-4">
            <TrendingUp size={24} className="rotate-180" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Out of Stock</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{outOfStockCount}</h3>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-slate-200 dark:border-dark-border flex flex-col md:flex-row gap-4">
        <TextField
          placeholder="Search designs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          sx={{ width: { xs: '100%', md: '12rem' } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Filter size={18} />
              </InputAdornment>
            ),
          }}
        >
          <MenuItem value=""><em>All Categories</em></MenuItem>
          {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </TextField>
        <TextField
          select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          sx={{ width: { xs: '100%', md: '12rem' } }}
        >
          <MenuItem value="ALL">All Stock Levels</MenuItem>
          <MenuItem value="LOW">Low Stock ({`<=${lowStockThreshold}`})</MenuItem>
          <MenuItem value="OUT">Out of Stock</MenuItem>
        </TextField>
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-slate-200 dark:border-dark-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading inventory...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-dark-bg border-b border-slate-200 dark:border-dark-border">
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Design Image</th>
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Design Details</th>
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Category</th>
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Rate</th>
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Available Stock</th>
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {filteredDesigns.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-500">No designs match the criteria.</td>
                  </tr>
                ) : (
                  filteredDesigns.map(design => (
                    <tr key={design.id} className="hover:bg-slate-50 dark:hover:bg-dark-bg/50 transition-colors">
                      <td className="p-4">
                        <div className="w-16 h-16 rounded bg-slate-100 dark:bg-dark-border overflow-hidden">
                          {design.image ? (
                            <img src={getImageUrl(design.image.split(',')[0].trim())} alt={design.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No Img</div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-slate-800 dark:text-white">{design.name}</p>
                        <p className="text-sm text-slate-500">{design.code}</p>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">{design.category?.name}</td>
                      <td className="p-4 font-medium text-slate-800 dark:text-white">₹{design.rate}</td>
                      <td className="p-4">
                        <span className={`text-lg font-bold ${design.availableStock <= 0 ? 'text-red-500' : design.availableStock <= lowStockThreshold ? 'text-yellow-500' : 'text-green-600'}`}>
                          {design.availableStock}
                        </span>
                      </td>
                      <td className="p-4">
                        {design.availableStock <= 0 ? (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">Out of Stock</span>
                        ) : design.availableStock <= lowStockThreshold ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">Low Stock</span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">In Stock</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryDashboard;
