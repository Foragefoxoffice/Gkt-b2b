import React, { useState, useEffect, useMemo } from 'react';
import { getDesignsApi, getCategoriesApi } from '../Action/api';
import { useSelector } from 'react-redux';
import { Package, AlertTriangle, Search, IndianRupee, ArrowDownUp, SlidersHorizontal, Layers, Archive, Box, TrendingUp, TrendingDown, MoreHorizontal } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { TextField, MenuItem, InputAdornment } from '@mui/material';
import Pagination from '../components/Pagination';

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
  <div className="card p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
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
  </div>
);

const InventoryDashboard = () => {
  const { token } = useSelector(state => state.auth);

  const [designs, setDesigns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL'); // ALL, IN, LOW, OUT
  const [sortBy, setSortBy] = useState('name_asc');

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    fetchData();

    const handleUpdate = () => fetchData();
    window.addEventListener('inventoryUpdated', handleUpdate);
    return () => window.removeEventListener('inventoryUpdated', handleUpdate);
  }, []);

  const fetchData = async () => {
    if (designs.length === 0) setLoading(true);
    try {
      const [designsRes, catRes] = await Promise.all([
        getDesignsApi({ limit: 5000 }), // Fetch all to calculate global KPIs accurately
        getCategoriesApi({ limit: 5000 })
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

  const { filteredAndSortedDesigns, totalItems, totalPages, kpis } = useMemo(() => {
    // Calculate KPIs
    let totalStock = 0;
    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    designs.forEach(d => {
      totalStock += d.availableStock;
      totalValue += (d.availableStock * (d.rate || 0));
      if (d.availableStock <= 0) outOfStockCount++;
      else if (d.availableStock <= lowStockThreshold) lowStockCount++;
    });

    // Filter
    let result = designs.filter(d => {
      const matchSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategory && selectedCategory !== 'ALL' ? d.categoryId === parseInt(selectedCategory) : true;
      let matchStock = true;
      if (stockFilter === 'IN') matchStock = d.availableStock > 0;
      if (stockFilter === 'LOW') matchStock = d.availableStock > 0 && d.availableStock <= lowStockThreshold;
      if (stockFilter === 'OUT') matchStock = d.availableStock <= 0;

      return matchSearch && matchCat && matchStock;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc': return a.name.localeCompare(b.name);
        case 'name_desc': return b.name.localeCompare(a.name);
        case 'stock_asc': return a.availableStock - b.availableStock;
        case 'stock_desc': return b.availableStock - a.availableStock;
        case 'price_asc': return (a.rate || 0) - (b.rate || 0);
        case 'price_desc': return (b.rate || 0) - (a.rate || 0);
        default: return 0;
      }
    });

    const totalItems = result.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    
    // Slice for current page
    const paginatedResult = result.slice((page - 1) * limit, page * limit);

    return {
      filteredAndSortedDesigns: paginatedResult,
      totalItems,
      totalPages,
      kpis: {
        totalDesigns: designs.length,
        totalStock,
        totalValue,
        lowStockCount,
        outOfStockCount
      }
    };
  }, [designs, searchTerm, selectedCategory, stockFilter, sortBy, page, limit]);

  const getImageUrl = (path) => {
    if (!path) return '';
    const cleanPath = path.replace(/\\/g, '/');
    return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  }

  const maxVisualStock = 100; // Cap visual bar at 100 units

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
            <Package className="mr-3 text-primary-600" /> Inventory Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage your catalog, track stock levels, and monitor inventory value.</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Designs"
          value={kpis.totalDesigns}
          trend="+5.2%"
          isPositive={true}
          sparklineData={[{ value: 20 }, { value: 30 }, { value: 40 }, { value: 35 }, { value: 50 }, { value: 45 }, { value: 60 }]}
          color="#0ea5e9"
        />
        <KPICard
          title="Total Units"
          value={kpis.totalStock}
          trend="+1.1%"
          isPositive={true}
          sparklineData={[{ value: 60 }, { value: 55 }, { value: 65 }, { value: 70 }, { value: 68 }, { value: 75 }, { value: 80 }]}
          color="#10b981"
        />
        <KPICard
          title="Est. Value"
          value={formatCurrency(kpis.totalValue)}
          trend="+2.4%"
          isPositive={true}
          sparklineData={[{ value: 40 }, { value: 50 }, { value: 45 }, { value: 60 }, { value: 55 }, { value: 70 }, { value: 75 }]}
          color="#e2148d"
        />
        <KPICard
          title="Attention Needed"
          value={
            <div className="flex items-center gap-1.5 text-2xl">
              <span className="text-orange-500">{kpis.lowStockCount}</span>
              <span className="text-sm font-medium text-orange-500 uppercase">Low</span>
              <span className="text-slate-300 dark:text-slate-600 mx-1">|</span>
              <span className="text-rose-500">{kpis.outOfStockCount}</span>
              <span className="text-sm font-medium text-rose-500 uppercase">Out</span>
            </div>
          }
          trend="-1.5%"
          isPositive={true}
          sparklineData={[{ value: 30 }, { value: 25 }, { value: 28 }, { value: 20 }, { value: 22 }, { value: 15 }, { value: 10 }]}
          color="#f59e0b"
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
              placeholder="Search designs by name or code..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Category Filter */}
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

          {/* Stock Level Filter */}
          <TextField
            select
            fullWidth
            size="small"
            label="Stock Status"
            value={stockFilter}
            onChange={(e) => { setStockFilter(e.target.value); setPage(1); }}
          >
            <MenuItem value="ALL">All Stock Levels</MenuItem>
            <MenuItem value="IN">In Stock</MenuItem>
            <MenuItem value="LOW">Low Stock (≤{lowStockThreshold})</MenuItem>
            <MenuItem value="OUT">Out of Stock</MenuItem>
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
            <MenuItem value="name_asc">Name (A - Z)</MenuItem>
            <MenuItem value="name_desc">Name (Z - A)</MenuItem>
            <MenuItem value="stock_desc">Stock (High to Low)</MenuItem>
            <MenuItem value="stock_asc">Stock (Low to High)</MenuItem>
            <MenuItem value="price_desc">Price (High to Low)</MenuItem>
            <MenuItem value="price_asc">Price (Low to High)</MenuItem>
          </TextField>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-slate-100 dark:border-dark-border overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            Loading inventory data...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-dark-bg/80 border-b border-slate-100 dark:border-dark-border text-md font-medium text-slate-600 dark:text-slate-300">
                  <th className="p-4 pl-6 text-md font-medium">Product</th>
                  <th className="p-4 text-md font-medium">Category</th>
                  <th className="p-4 text-md font-medium">Unit Price</th>
                  <th className="p-4 text-md font-medium">Stock Level</th>
                  <th className="p-4 pr-6 text-md font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {filteredAndSortedDesigns.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-16 text-center">
                      <Archive className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                      <p className="text-slate-600 dark:text-slate-300 text-lg font-medium">No designs found</p>
                      <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Try adjusting your filters or search terms.</p>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedDesigns.map(design => {
                    const stockPercentage = Math.min(100, Math.max(0, (design.availableStock / maxVisualStock) * 100));
                    return (
                      <tr key={design.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-bg/50 transition-colors group">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-dark-bg overflow-hidden border border-slate-200 dark:border-dark-border flex-shrink-0">
                              {design.image ? (
                                <img src={getImageUrl(design.image.split(',')[0].trim())} alt={design.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-medium uppercase tracking-widest">No Img</div>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-white text-sm">{design.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono bg-slate-100 dark:bg-dark-bg inline-block px-1.5 py-0.5 rounded border border-slate-200 dark:border-dark-border">{design.code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-dark-bg dark:text-slate-300 border border-slate-200 dark:border-dark-border">
                            {design.designcategory?.name || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-800 dark:text-white text-sm">{formatCurrency(design.rate)}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1.5 w-32">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{design.availableStock} <span className="font-normal text-slate-500">units</span></span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-dark-bg rounded-full h-2 overflow-hidden border border-slate-200 dark:border-dark-border">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${design.availableStock <= 0 ? 'bg-red-500' : design.availableStock <= lowStockThreshold ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                style={{ width: `${stockPercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 pr-6">
                          {design.availableStock <= 0 ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400 mr-1.5"></span> Out of Stock
                            </span>
                          ) : design.availableStock <= lowStockThreshold ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-600 dark:bg-orange-400 mr-1.5"></span> Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 mr-1.5"></span> In Stock
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
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
                itemName="designs" 
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryDashboard;
