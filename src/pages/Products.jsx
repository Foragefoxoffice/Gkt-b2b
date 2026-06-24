import React, { useState, useEffect, useMemo } from 'react';
import { getDesignsApi, getCategoriesApi, addToCartApi, getCartApi } from '../Action/api';
import { ShoppingCart, Search, Filter, Plus, Minus, X, Package, Star, TrendingUp, Tag, ChevronRight, Check, Eye } from 'lucide-react';
import { Select, MenuItem, Slider, Checkbox, FormControlLabel } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Products() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination state
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Filtering states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [sortBy, setSortBy] = useState('default');
    const [inStockOnly, setInStockOnly] = useState(false);
    const [priceRange, setPriceRange] = useState([0, 10000]);
    const [selectedColors, setSelectedColors] = useState([]);

    const maxProductPrice = useMemo(() => {
        if (!products || products.length === 0) return 10000;
        return Math.max(...products.map(p => p.rate));
    }, [products]);

    useEffect(() => {
        if (maxProductPrice > 0) {
            setPriceRange([0, maxProductPrice]);
        }
    }, [maxProductPrice]);

    const allAvailableColors = useMemo(() => {
        const colors = new Set();
        products.forEach(p => {
            if (p.colorStock) {
                try {
                    const parsed = typeof p.colorStock === 'string' ? JSON.parse(p.colorStock) : p.colorStock;
                    Object.keys(parsed).forEach(c => colors.add(c));
                } catch (e) {
                    if (p.color) colors.add(p.color);
                }
            } else if (p.color) {
                colors.add(p.color);
            }
        });
        return Array.from(colors).sort();
    }, [products]);

    // Modal states
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [selectedColor, setSelectedColor] = useState('');
    const [isAdded, setIsAdded] = useState(false);
    const [cartItems, setCartItems] = useState([]);

    const { availableColors, stockMap } = useMemo(() => {
        let colors = [];
        let map = {};
        if (selectedProduct) {
            if (selectedProduct.colorStock) {
                try {
                    const parsed = typeof selectedProduct.colorStock === 'string' ? JSON.parse(selectedProduct.colorStock) : selectedProduct.colorStock;
                    colors = Object.keys(parsed);
                    map = parsed;
                } catch (e) {
                    colors = selectedProduct.color ? [selectedProduct.color] : [];
                }
            } else if (selectedProduct.color) {
                colors = [selectedProduct.color];
            }
        }
        return { availableColors: colors, stockMap: map };
    }, [selectedProduct]);

    const maxQuantity = useMemo(() => {
        if (!selectedProduct) return 1;
        if (selectedColor && stockMap[selectedColor] !== undefined) {
            return parseInt(stockMap[selectedColor]);
        }
        return parseInt(selectedProduct.availableStock);
    }, [selectedProduct, selectedColor, stockMap]);

    useEffect(() => {
        fetchInitialData();
        fetchCart();
        const handleCartUpdate = () => fetchCart();
        const handleInventoryUpdate = () => fetchInitialData();

        window.addEventListener('cartUpdated', handleCartUpdate);
        window.addEventListener('inventoryUpdated', handleInventoryUpdate);

        return () => {
            window.removeEventListener('cartUpdated', handleCartUpdate);
            window.removeEventListener('inventoryUpdated', handleInventoryUpdate);
        };
    }, []);

    const fetchCart = async () => {
        try {
            const res = await getCartApi();
            if (res.data && res.data.success) {
                setCartItems(res.data.data.cart?.items || []);
            }
        } catch (err) {
            console.error('Failed to fetch cart', err);
        }
    };

    useEffect(() => {
        if (!selectedProduct) return;
        const inCart = cartItems.some(item =>
            item.designId === selectedProduct.id &&
            (item.color === selectedColor || (!item.color && !selectedColor))
        );
        setIsAdded(inCart);
    }, [cartItems, selectedProduct, selectedColor]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [designsRes, categoriesRes] = await Promise.all([
                getDesignsApi({ page: 1, limit: 20 }),
                getCategoriesApi()
            ]);

            const initialProducts = designsRes.data.data || [];
            setProducts(initialProducts);
            setCategories(categoriesRes.data.data || []);

            if (designsRes.data.pagination) {
                setHasMore(designsRes.data.pagination.page < designsRes.data.pagination.totalPages);
            } else {
                setHasMore(initialProducts.length === 20);
            }
        } catch (err) {
            toast.error('Failed to load products');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = async () => {
        if (!hasMore || loadingMore) return;
        const nextPage = page + 1;
        setLoadingMore(true);
        try {
            const res = await getDesignsApi({ page: nextPage, limit: 20 });
            const newProducts = res.data.data || [];

            setProducts(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const uniqueNew = newProducts.filter(p => !existingIds.has(p.id));
                return [...prev, ...uniqueNew];
            });
            setPage(nextPage);

            if (res.data.pagination) {
                setHasMore(res.data.pagination.page < res.data.pagination.totalPages);
            } else {
                setHasMore(newProducts.length === 20);
            }
        } catch (err) {
            toast.error('Failed to load more products');
        } finally {
            setLoadingMore(false);
        }
    };

    const filteredProducts = useMemo(() => {
        let result = products.filter(p => {
            const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.code.toLowerCase().includes(searchTerm.toLowerCase());
            const matchCategory = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
            const matchStock = inStockOnly ? p.availableStock > 0 : true;

            const matchPrice = p.rate >= priceRange[0] && p.rate <= priceRange[1];

            let matchColor = true;
            if (selectedColors.length > 0) {
                let pColors = [];
                if (p.colorStock) {
                    try {
                        const parsed = typeof p.colorStock === 'string' ? JSON.parse(p.colorStock) : p.colorStock;
                        pColors = Object.keys(parsed);
                    } catch (e) {
                        pColors = p.color ? [p.color] : [];
                    }
                } else if (p.color) {
                    pColors = [p.color];
                }
                matchColor = selectedColors.some(c => pColors.includes(c));
            }

            return matchSearch && matchCategory && matchStock && matchPrice && matchColor;
        });

        // Apply sorting
        if (sortBy === 'price_asc') {
            result.sort((a, b) => a.rate - b.rate);
        } else if (sortBy === 'price_desc') {
            result.sort((a, b) => b.rate - a.rate);
        } else if (sortBy === 'name_asc') {
            result.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === 'name_desc') {
            result.sort((a, b) => b.name.localeCompare(a.name));
        }

        return result;
    }, [products, searchTerm, selectedCategory, sortBy, inStockOnly, priceRange, selectedColors]);

    const featuredProducts = useMemo(() => {
        return products.filter(p => p.tags && p.tags.includes('New Arrival')).slice(0, 4);
    }, [products]);

    const openAddToCartModal = (product) => {
        setSelectedProduct(product);
        setQuantity(1);

        // Parse color options
        let colors = [];
        if (product.colorStock) {
            try {
                const parsed = typeof product.colorStock === 'string' ? JSON.parse(product.colorStock) : product.colorStock;
                colors = Object.keys(parsed);
            } catch (e) {
                colors = product.color ? [product.color] : [];
            }
        } else if (product.color) {
            colors = [product.color];
        }

        setSelectedColor(colors.length > 0 ? colors[0] : '');
        setIsModalOpen(true);
    };

    const closeAddToCartModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedProduct(null), 300);
    };

    const handleAddToCart = async () => {
        if (!selectedProduct) return;

        try {
            await addToCartApi({
                designId: selectedProduct.id,
                quantity: quantity,
                color: selectedColor || undefined
            });
            toast.success(`${selectedProduct.name} added to cart!`);
            window.dispatchEvent(new Event('cartUpdated'));
            setIsAdded(true);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add to cart');
        }
    };

    const formatPrice = (val) => {
        if (val === undefined || val === null) return '';
        const [intPart, decPart] = val.toString().split('.');
        const formattedInt = intPart.replace(/(\d)(?=(\d\d)+\d$)/g, "$1,");
        return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
    };

    const getImageUrl = (imageString) => {
        if (!imageString) return null;
        const firstImage = imageString.split(',')[0].trim().replace(/\\/g, '/');
        return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${firstImage}`;
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-12">

            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-primary-900 via-primary-800 to-primary-600 shadow-2xl"
            >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10 px-8 py-16 md:px-10 md:py-10 flex flex-col md:flex-row items-center justify-between">
                    <div className="max-w-2xl text-white">
                        <span className="inline-block py-1 px-3 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium mb-4 border border-white/30">
                            Premium Collections
                        </span>
                        <h1 className="text-4xl md:text-4xl font-semibold mb-4 leading-tight">
                            Discover Extraordinary <br /> Designs
                        </h1>
                        <p className="text-lg text-primary-100 mb-8 max-w-xl leading-relaxed">
                            Browse our exclusive catalog of high-quality products. Filter by category, find what you need, and add it to your cart in seconds.
                        </p>
                        <div className="flex items-center bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20 w-full max-w-md">
                            <Search className="text-white ml-3 mr-2" size={20} />
                            <input
                                type="text"
                                placeholder="Search products by name or code..."
                                className="bg-transparent border-none outline-none text-white placeholder-white/70 w-full py-2 px-2"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <div className="w-64 h-64 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 flex items-center justify-center relative animate-[spin_60s_linear_infinite]">
                            <div className="w-48 h-48 bg-gradient-to-tr from-white/20 to-transparent rounded-full flex items-center justify-center">
                                <img alt="Logo" className="w-auto" src="https://agssmtbuyers.com/AmbigaaSilks_logo.png" />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Featured / New Arrivals Section */}
            {featuredProducts.length > 0 && !searchTerm && selectedCategory === 'ALL' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h2 className="text-2xl font-semibold text-slate-800 dark:text-white flex items-center">
                                <TrendingUp className="mr-2 text-rose-500" /> New Arrivals
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">The latest additions to our catalog.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {featuredProducts.map((product) => (
                            <ProductCard key={`featured-${product.id}`} product={product} onAddToCart={() => openAddToCartModal(product)} getImageUrl={getImageUrl} formatPrice={formatPrice} navigate={navigate} />
                        ))}
                    </div>
                </motion.div>
            )}

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Sidebar / Filters */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full lg:w-64 shrink-0 bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-slate-100 dark:border-dark-border p-6 sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                    <div className="flex items-center gap-2 text-slate-800 dark:text-white font-semibold text-lg mb-6 pb-4 border-b border-slate-100 dark:border-dark-border">
                        <Filter size={20} className="text-primary-600" /> Filters
                    </div>

                    <div className="space-y-8">
                        {/* Sort By */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">Sort By</h3>
                            <Select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                fullWidth
                                size="small"
                                className="bg-slate-50 dark:bg-dark-bg"
                                sx={{ borderRadius: '0.75rem', '& fieldset': { borderColor: '#e2e8f0' }, '.MuiSelect-select': { py: 1.5, px: 2, fontSize: '0.875rem', fontWeight: 500, color: '#334155' } }}
                            >
                                <MenuItem value="default">Default</MenuItem>
                                <MenuItem value="price_asc">Price: Low to High</MenuItem>
                                <MenuItem value="price_desc">Price: High to Low</MenuItem>
                                <MenuItem value="name_asc">Name: A to Z</MenuItem>
                                <MenuItem value="name_desc">Name: Z to A</MenuItem>
                            </Select>
                        </div>

                        {/* Availability */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">Availability</h3>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={inStockOnly}
                                        onChange={(e) => setInStockOnly(e.target.checked)}
                                        sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#0ea5e9' }, p: 0.5, ml: 1 }}
                                    />
                                }
                                label={<span className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">In Stock Only</span>}
                                sx={{ m: 0 }}
                            />
                        </div>

                        {/* Price Filter */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">Price Range</h3>
                            <div className="px-2">
                                <Slider
                                    value={priceRange}
                                    onChange={(e, newValue) => setPriceRange(newValue)}
                                    valueLabelDisplay="auto"
                                    min={0}
                                    max={maxProductPrice > 0 ? maxProductPrice : 10000}
                                    sx={{
                                        color: '#0ea5e9',
                                        '& .MuiSlider-thumb': { backgroundColor: '#fff', border: '2px solid currentColor' }
                                    }}
                                />
                                <div className="flex justify-between text-xs text-slate-500 font-medium">
                                    <span>₹{priceRange[0]}</span>
                                    <span>₹{priceRange[1]}</span>
                                </div>
                            </div>
                        </div>

                        {/* Color */}
                        {allAvailableColors.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">Colors</h3>
                                <Select
                                    multiple
                                    displayEmpty
                                    value={selectedColors}
                                    onChange={(e) => {
                                        const { value } = e.target;
                                        setSelectedColors(typeof value === 'string' ? value.split(',') : value);
                                    }}
                                    renderValue={(selected) => {
                                        if (selected.length === 0) {
                                            return <span className="text-slate-400">All Colors</span>;
                                        }
                                        return selected.join(', ');
                                    }}
                                    fullWidth
                                    size="small"
                                    className="bg-slate-50 dark:bg-dark-bg"
                                    sx={{ borderRadius: '0.75rem', '& fieldset': { borderColor: '#e2e8f0' }, '.MuiSelect-select': { py: 1.5, px: 2, fontSize: '0.875rem', color: '#334155' } }}
                                >
                                    {allAvailableColors.map((color) => (
                                        <MenuItem key={color} value={color} sx={{ fontSize: '0.875rem' }}>
                                            <Checkbox checked={selectedColors.indexOf(color) > -1} size="small" />
                                            {color}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </div>
                        )}

                        {/* Categories */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">Categories</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => setSelectedCategory('ALL')}
                                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex justify-between items-center ${selectedCategory === 'ALL' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-bg hover:text-slate-900 dark:hover:text-slate-200'}`}
                                >
                                    All Products
                                    {selectedCategory === 'ALL' && <ChevronRight size={16} />}
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex justify-between items-center ${selectedCategory === cat.id ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-bg hover:text-slate-900 dark:hover:text-slate-200'}`}
                                    >
                                        <span className="truncate">{cat.name}</span>
                                        {selectedCategory === cat.id && <ChevronRight size={16} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Main Product Grid */}
                <div className="flex-1 w-full">
                    <div className="mb-6 flex justify-between items-center">
                        <h2 className="text-2xl font-semibold text-slate-800 dark:text-white flex items-center">
                            <Package className="mr-2 text-primary-600" />
                            {selectedCategory === 'ALL' ? 'All Products' : categories.find(c => c.id === selectedCategory)?.name || 'Products'}
                        </h2>
                        <span className="text-sm font-medium text-slate-500 bg-slate-100 dark:bg-dark-border px-3 py-1 rounded-full">
                            {filteredProducts.length} items
                        </span>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="bg-white dark:bg-dark-card rounded-2xl h-80 animate-pulse border border-slate-100 dark:border-dark-border p-4 flex flex-col">
                                    <div className="h-48 bg-slate-200 dark:bg-slate-700/50 rounded-xl mb-4"></div>
                                    <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded-full w-3/4 mb-2"></div>
                                    <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded-full w-1/2 mb-4"></div>
                                    <div className="mt-auto h-10 bg-slate-200 dark:bg-slate-700/50 rounded-xl"></div>
                                </div>
                            ))}
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-dark-border p-16 text-center flex flex-col items-center shadow-sm">
                            <div className="w-24 h-24 bg-slate-50 dark:bg-dark-bg rounded-full flex items-center justify-center mb-6">
                                <Search size={40} className="text-slate-300 dark:text-slate-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No products found</h3>
                            <p className="text-slate-500 dark:text-slate-500 max-w-md">
                                We couldn't find any products matching your current filters. Try adjusting your search or category selection.
                            </p>
                            <button
                                onClick={() => { setSearchTerm(''); setSelectedCategory('ALL'); setSortBy('default'); setInStockOnly(false); setPriceRange([0, maxProductPrice]); setSelectedColors([]); }}
                                className="mt-6 px-6 py-2.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium rounded-xl hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
                            >
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        <>
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="show"
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                            >
                                {filteredProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} onAddToCart={() => openAddToCartModal(product)} getImageUrl={getImageUrl} formatPrice={formatPrice} navigate={navigate} />
                                ))}
                            </motion.div>

                            {hasMore && (
                                <div className="flex justify-center mt-12 mb-8">
                                    <button
                                        onClick={loadMore}
                                        disabled={loadingMore}
                                        className="px-8 py-3 bg-white dark:bg-dark-card text-primary-600 dark:text-primary-400 border-2 border-primary-100 dark:border-primary-900/30 rounded-full font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-800 transition-all flex items-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loadingMore ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-600 dark:border-primary-400 mr-3"></div>
                                                Loading...
                                            </>
                                        ) : (
                                            'Load More Products'
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Add To Cart Modal */}
            <AnimatePresence>
                {isModalOpen && selectedProduct && (
                    <div className="fixed modal_main inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={closeAddToCartModal}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-white dark:bg-dark-card rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-dark-border"
                        >
                            <button
                                onClick={closeAddToCartModal}
                                className="absolute top-4 right-4 z-10 p-2 bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-black backdrop-blur-md rounded-full text-slate-500 transition-all"
                            >
                                <X size={20} />
                            </button>

                            <div className="h-48 bg-slate-100 dark:bg-dark-bg relative overflow-hidden">
                                {getImageUrl(selectedProduct.image) ? (
                                    <img src={getImageUrl(selectedProduct.image)} alt={selectedProduct.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <Package size={48} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                                    <h3 className="text-2xl font-semibold text-white leading-tight">{selectedProduct.name}</h3>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-mono text-slate-500 bg-slate-100 dark:bg-dark-border px-2 py-0.5 rounded inline-block mb-1">{selectedProduct.code}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Total Stock: <span className="font-semibold text-slate-800 dark:text-white">{selectedProduct.availableStock}</span></p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-semibold text-primary-600 dark:text-primary-400">₹{formatPrice(selectedProduct.rate.toFixed(2))}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">+ {selectedProduct.gstPercent}% GST</p>
                                    </div>
                                </div>

                                {selectedProduct.material && (
                                    <div className="pt-2">
                                        <p className="text-sm text-slate-500">Material</p>
                                        <p className="font-medium text-slate-800 dark:text-white">{selectedProduct.material}</p>
                                    </div>
                                )}

                                {availableColors.length > 0 && (
                                    <div className="pt-2">
                                        <p className="text-sm text-slate-500 mb-1.5">Available Colors</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {availableColors.map(c => (
                                                <span key={c} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs rounded-md font-medium">
                                                    {c} {stockMap[c] !== undefined && <span className="opacity-60 ml-1">({stockMap[c]})</span>}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-6 mt-4 border-t border-slate-100 dark:border-dark-border">
                                    <button
                                        onClick={() => navigate(`/buyer/product/${selectedProduct.id}`, { state: { product: selectedProduct } })}
                                        className="w-full py-3.5 font-medium rounded-xl flex items-center justify-center transition-all bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/30 hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        View Full Product Page
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

const ProductCard = ({ product, onAddToCart, getImageUrl, formatPrice, navigate }) => {
    const isNew = product.tags && product.tags.includes('New Arrival');
    const outOfStock = product.availableStock <= 0;

    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
            }}
            onClick={() => navigate(`/buyer/product/${product.id}`, { state: { product } })}
            className="group cursor-pointer bg-white dark:bg-dark-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-100 dark:border-dark-border transition-all duration-300 hover:-translate-y-1 flex flex-col"
        >
            <div className="relative h-56 bg-slate-100 dark:bg-dark-bg overflow-hidden">
                {getImageUrl(product.image) ? (
                    <img
                        src={getImageUrl(product.image)}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Package size={40} />
                    </div>
                )}

                {isNew && (
                    <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md z-10 flex items-center">
                        <Star size={10} className="mr-1 fill-white" /> New
                    </div>
                )}

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
                    <button
                        onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
                        className="px-5 py-2.5 rounded-full font-semibold flex items-center transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 bg-white text-primary-600 hover:bg-primary-50 hover:scale-105 shadow-lg"
                    >
                        <Eye size={18} className="mr-2" /> View Details
                    </button>
                </div>
            </div>

            <div className="p-5 flex flex-col flex-1 relative">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" title={product.name}>
                            {product.name}
                        </h3>
                        <p className="text-xs font-mono text-slate-500 mt-0.5">{product.code}</p>
                    </div>
                </div>

                <div className="mt-auto pt-4 flex items-end justify-between border-t border-slate-50 dark:border-dark-border">
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Price</p>
                        <p className="text-lg font-bold text-slate-800 dark:text-white">₹{formatPrice(product.rate.toFixed(2))}</p>
                    </div>

                    <div className="text-right">
                        <p className={`text-xs font-medium px-2 py-1 rounded-md ${outOfStock ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'}`}>
                            {outOfStock ? 'Out of Stock' : `${product.availableStock} in stock`}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};