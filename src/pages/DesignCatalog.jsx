import React, { useState, useEffect } from 'react';
import { getDesignsApi, getCategoriesApi, addToCartApi, getCartApi } from '../Action/api';
import { useSelector } from 'react-redux';
import { Search, Filter, ShoppingCart, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const DesignCatalog = () => {
  const { token } = useSelector(state => state.auth);

  const [designs, setDesigns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartItemIds, setCartItemIds] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const [selectedImage, setSelectedImage] = useState(null);

  const getImageUrl = (path) => {
    if (!path) return '';
    const cleanPath = path.replace(/\\/g, '/');
    return `http://localhost:5000${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
  };

  const formatPrice = (val) => {
    if (!val) return '';
    const [intPart, decPart] = val.toString().split('.');
    const formattedInt = intPart.replace(/(\d)(?=(\d\d)+\d$)/g, "$1,");
    return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [designsRes, catRes, cartRes] = await Promise.all([
        getDesignsApi(),
        getCategoriesApi(),
        getCartApi()
      ]);
      setDesigns(designsRes.data.data);
      setCategories(catRes.data.data);
      
      const ids = cartRes.data?.data?.cart?.items?.map(item => item.designId) || [];
      setCartItemIds(ids);
    } catch (err) {
      toast.error('Failed to load designs');
    } finally {
      setLoading(false);
    }
  };

  const [addingIds, setAddingIds] = useState({});

  const handleAddToCart = async (designId) => {
    setAddingIds(prev => ({ ...prev, [designId]: true }));
    try {
      await addToCartApi({ designId, quantity: 1 });
      toast.success('Added to cart');
      setTimeout(() => {
        setCartItemIds(prev => [...prev, designId]);
        setAddingIds(prev => ({ ...prev, [designId]: false }));
      }, 2500); // 1.5s animation + buffer
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
      setAddingIds(prev => ({ ...prev, [designId]: false }));
    }
  };

  const filteredDesigns = designs.filter(design => {
    const matchesSearch = design.name.toLowerCase().includes(searchTerm.toLowerCase()) || design.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? design.categoryId === parseInt(selectedCategory) : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Designs Gallery</h1>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-slate-200 dark:border-dark-border flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by design name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="w-full md:w-64 relative">
          <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field pl-10"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading designs...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredDesigns.length === 0 ? (
            <div className="col-span-full p-12 text-center text-slate-500 bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border">
              No designs found matching your filters.
            </div>
          ) : (
            filteredDesigns.map(design => (
              <div key={design.id} className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-slate-200 dark:border-dark-border overflow-hidden group hover:shadow-md transition-shadow">
                <div className="aspect-[4/3] bg-slate-100 dark:bg-dark-border relative overflow-hidden">
                  {design.image ? (
                    <img
                      src={getImageUrl(design.image)}
                      alt={design.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                      onClick={() => setSelectedImage(getImageUrl(design.image))}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                  )}
                  {design.availableStock <= 0 && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">Out of Stock</div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-white truncate">{design.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{design.code}</p>
                    </div>
                    <span className="font-bold text-primary-600 dark:text-primary-400">₹{formatPrice(design.rate)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-400">
                    <span>{design.category?.name}</span>
                    <span>Stock: {design.availableStock}</span>
                  </div>
                  {(() => {
                    const isAdded = cartItemIds.includes(design.id);
                    const isAnimating = addingIds[design.id];
                    return (
                      <button 
                        onClick={() => handleAddToCart(design.id)}
                        disabled={design.availableStock <= 0 || isAnimating || isAdded}
                        className={`cart-button w-full mt-4 flex justify-center items-center py-2 h-10 rounded-lg text-white font-medium 
                          ${isAdded ? 'already-added cursor-not-allowed shadow-none' : ''} 
                          ${isAnimating ? 'clicked bg-primary-500' : (!isAdded ? 'bg-primary-600 hover:bg-primary-500 shadow-sm shadow-primary-500/30' : '')} 
                          ${design.availableStock <= 0 && !isAdded ? 'opacity-50 cursor-not-allowed bg-slate-300 hover:bg-slate-300 shadow-none' : ''}`}
                      >
                        <span className="add-to-cart flex items-center">
                          {isAdded ? 'Added' : 'Add to Cart'}
                        </span>
                        <span className="added">Added</span>
                        <ShoppingCart size={18} className="cart-icon" />
                        <Package size={14} className="box-icon" />
                      </button>
                    );
                  })()}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 modal_main bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 transition-all" onClick={() => setSelectedImage(null)}>
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

export default DesignCatalog;
