import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getDesignByIdApi, getDesignsApi, addToCartApi, getCartApi } from '../Action/api';
import { ShoppingCart, ArrowLeft, Plus, Minus, Package, ShieldCheck, Truck, RefreshCw, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function ProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [product, setProduct] = useState(location.state?.product || null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(!product);
    const [relatedLoading, setRelatedLoading] = useState(true);

    // Selection states
    const [quantity, setQuantity] = useState(1);
    const [selectedColor, setSelectedColor] = useState('');
    const [mainImage, setMainImage] = useState('');
    const [isAdded, setIsAdded] = useState(false);
    const [cartItems, setCartItems] = useState([]);

    const [zoomPos, setZoomPos] = useState({ x: 50, y: 50, show: false });

    const handleMouseMove = (e) => {
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setZoomPos({ x, y, show: true });
    };

    const handleMouseLeave = () => {
        setZoomPos({ x: 50, y: 50, show: false });
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchProduct();
        fetchCart();
    }, [id]);

    useEffect(() => {
        const handleCartUpdate = () => fetchCart();
        window.addEventListener('cartUpdated', handleCartUpdate);
        return () => window.removeEventListener('cartUpdated', handleCartUpdate);
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
        if (!product) return;
        const inCart = cartItems.some(item =>
            item.designId === product.id &&
            (item.color === selectedColor || (!item.color && !selectedColor))
        );
        setIsAdded(inCart);
    }, [cartItems, product, selectedColor]);

    const fetchProduct = async () => {
        try {
            const res = await getDesignByIdApi(id);
            const fetchedProduct = res.data.data;
            setProduct(fetchedProduct);

            // Set initial main image
            const images = fetchedProduct.image ? fetchedProduct.image.split(',') : [];
            if (images.length > 0) {
                setMainImage(getImageUrl(images[0]));
            }

            // Set initial color
            const { availableColors } = parseColors(fetchedProduct);
            if (availableColors.length > 0 && !selectedColor) {
                setSelectedColor(availableColors[0]);
            }

            // Fetch related products
            if (fetchedProduct.categoryId) {
                fetchRelatedProducts(fetchedProduct.categoryId, fetchedProduct.id);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to load product details');
        } finally {
            setLoading(false);
        }
    };

    const fetchRelatedProducts = async (categoryId, currentProductId) => {
        setRelatedLoading(true);
        try {
            const res = await getDesignsApi();
            const allProducts = res.data.data;
            const related = allProducts.filter(p => p.categoryId === categoryId && p.id !== currentProductId).slice(0, 4);
            setRelatedProducts(related);
        } catch (err) {
            console.error(err);
        } finally {
            setRelatedLoading(false);
        }
    };

    const getImageUrl = (imageString) => {
        if (!imageString) return null;
        const firstImage = imageString.split(',')[0].trim().replace(/\\/g, '/');
        return `http://localhost:5000${firstImage}`;
    };

    const formatPrice = (val) => {
        if (val === undefined || val === null) return '';
        const [intPart, decPart] = val.toString().split('.');
        const formattedInt = intPart.replace(/(\d)(?=(\d\d)+\d$)/g, "$1,");
        return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
    };

    const parseColors = (prod) => {
        let colors = [];
        let map = {};
        if (prod) {
            if (prod.colorStock) {
                try {
                    const parsed = typeof prod.colorStock === 'string' ? JSON.parse(prod.colorStock) : prod.colorStock;
                    colors = Object.keys(parsed);
                    map = parsed;
                } catch (e) {
                    colors = prod.color ? [prod.color] : [];
                }
            } else if (prod.color) {
                colors = [prod.color];
            }
        }
        return { availableColors: colors, stockMap: map };
    };

    const { availableColors, stockMap } = useMemo(() => parseColors(product), [product]);

    const maxQuantity = useMemo(() => {
        if (!product) return 1;
        if (selectedColor && stockMap[selectedColor] !== undefined) {
            return parseInt(stockMap[selectedColor]);
        }
        return parseInt(product.availableStock);
    }, [product, selectedColor, stockMap]);

    const handleAddToCart = async () => {
        if (!product) return;
        try {
            await addToCartApi({
                designId: product.id,
                quantity: quantity,
                color: selectedColor || undefined
            });
            toast.success(`${product.name} added to cart!`);
            window.dispatchEvent(new Event('cartUpdated'));

            setIsAdded(true);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add to cart');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Product Not Found</h2>
                <button onClick={() => navigate('/buyer/products')} className="text-primary-600 hover:underline flex items-center justify-center mx-auto">
                    <ArrowLeft className="mr-2" size={18} /> Back to Products
                </button>
            </div>
        );
    }

    const images = product.image ? product.image.split(',') : [];
    const outOfStock = product.availableStock <= 0;

    return (
        <div className="max-w-7xl mx-auto pb-12 space-y-12">
            {/* Back Navigation */}
            <button
                onClick={() => navigate('/buyer/products')}
                className="flex items-center text-slate-500 hover:text-primary-600 transition-colors font-medium"
            >
                <ArrowLeft size={20} className="mr-2" /> Back to Products
            </button>

            {/* Product Section */}
            <div style={{ marginTop: '2rem' }} className="bg-white dark:bg-dark-card rounded-3xl shadow-sm border border-slate-100 dark:border-dark-border overflow-hidden">
                <div className="flex flex-col md:flex-row">

                    {/* Left: Images */}
                    <div className="md:w-1/2 p-8 md:border-r border-slate-100 dark:border-dark-border flex flex-col">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-slate-50 dark:bg-dark-bg rounded-2xl h-96 md:h-[500px] flex items-center justify-center overflow-hidden relative mb-6 cursor-zoom-in"
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                        >
                            {mainImage || getImageUrl(images[0]) ? (
                                <img 
                                    src={mainImage || getImageUrl(images[0])} 
                                    alt={product.name} 
                                    className={`w-full h-full transition-transform duration-200 ease-out ${zoomPos.show ? 'object-cover' : 'object-contain'}`}
                                    style={{
                                        transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                                        transform: zoomPos.show ? 'scale(2.5)' : 'scale(1)'
                                    }}
                                />
                            ) : (
                                <Package size={64} className="text-slate-300" />
                            )}
                            {product.tags && product.tags.includes('New Arrival') && (
                                <div className="absolute top-4 left-4 bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-md z-10 pointer-events-none">
                                    New Arrival
                                </div>
                            )}
                        </motion.div>

                        {/* Image Gallery */}
                        {images.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setMainImage(getImageUrl(img))}
                                        className={`w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${mainImage === getImageUrl(img) ? 'border-primary-500' : 'border-transparent hover:border-slate-300'}`}
                                    >
                                        <img src={getImageUrl(img)} alt={`${product.name} ${idx}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Details */}
                    <div className="md:w-1/2 p-8 md:p-8 flex flex-col">
                        <div className="mb-4">
                            <span className="text-xs font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400 px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">
                                {product.category?.name || 'Category'}
                            </span>
                            <h1 className="text-3xl md:text-3xl font-semibold text-slate-800 dark:text-white mb-2 leading-tight">
                                {product.name}
                            </h1>
                            <p className="text-lg font-mono text-slate-500 dark:text-slate-400">Code: {product.code}</p>
                        </div>

                        <div className="flex items-end mb-6">
                            <p className="text-3xl font-semibold text-primary-600 dark:text-primary-400">
                                ₹{formatPrice(product.rate.toFixed(2))}
                            </p>
                            <p className="text-sm text-slate-500 mb-1 ml-2">+ {product.gstPercent}% GST</p>
                        </div>

                        {/* Colors */}
                        {availableColors.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3 uppercase tracking-wider">Available Colors</h3>
                                <div className="flex flex-wrap gap-3">
                                    {availableColors.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => {
                                                setSelectedColor(c);
                                                const newMax = stockMap[c] !== undefined ? parseInt(stockMap[c]) : parseInt(product.availableStock);
                                                if (quantity > newMax) setQuantity(Math.max(1, newMax));
                                            }}
                                            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all border ${selectedColor === c
                                                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-400 ring-2 ring-primary-500/20'
                                                : 'bg-white dark:bg-dark-bg border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 hover:border-slate-300'
                                                }`}
                                        >
                                            {c} {stockMap[c] !== undefined && <span className="opacity-60 ml-1">({stockMap[c]})</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="h-px bg-slate-100 dark:bg-dark-border w-full my-2"></div>

                        {/* Quantity and Stock */}
                        <div className="mb-8 mt-6">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-wider">Quantity</h3>
                                <span className={`text-sm font-medium px-2 py-1 rounded-md ${outOfStock ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {outOfStock ? 'Out of Stock' : `${product.availableStock} Available in Total`}
                                </span>
                            </div>

                            <div className="flex items-center space-x-6">
                                <div className="flex items-center bg-slate-50 dark:bg-dark-bg rounded-xl border border-slate-200 dark:border-dark-border p-1">
                                    <button
                                        onClick={() => {
                                            setQuantity(Math.max(1, quantity - 1));
                                            setIsAdded(false);
                                        }}
                                        disabled={quantity <= 1 || outOfStock}
                                        className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${quantity <= 1 || outOfStock ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                    >
                                        <Minus size={20} />
                                    </button>
                                    <span className="text-xl font-semibold text-slate-800 dark:text-white w-14 text-center">
                                        {outOfStock ? 0 : quantity}
                                    </span>
                                    <button
                                        onClick={() => {
                                            setQuantity(Math.min(maxQuantity, quantity + 1));
                                            setIsAdded(false);
                                        }}
                                        disabled={quantity >= maxQuantity || outOfStock}
                                        className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${quantity >= maxQuantity || outOfStock ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                                {quantity >= maxQuantity && maxQuantity > 0 && !outOfStock && (
                                    <p className="text-sm text-red-500 font-medium">Max limit reached</p>
                                )}
                            </div>
                        </div>

                        {/* Add to Cart Button */}
                        <div className="mt-auto">
                            <motion.button
                                whileTap={outOfStock ? {} : { scale: 0.95 }}
                                onClick={handleAddToCart}
                                disabled={outOfStock || isAdded}
                                className={`w-full py-4 text-lg font-medium rounded-2xl flex items-center justify-center transition-all ${outOfStock
                                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                    : isAdded
                                        ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                                        : 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-500/30 hover:-translate-y-1'}`}
                            >
                                {isAdded ? (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="flex items-center"
                                    >
                                        <Check size={24} className="mr-3" />
                                        Added to Cart!
                                    </motion.div>
                                ) : (
                                    <>
                                        <ShoppingCart size={24} className="mr-3" />
                                        {outOfStock ? 'Currently Unavailable' : 'Add to Cart'}
                                    </>
                                )}
                            </motion.button>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-100 dark:border-dark-border">
                            <div className="flex flex-col items-center text-center">
                                <ShieldCheck size={28} className="text-emerald-500 mb-2" />
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Premium<br />Quality</span>
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <Truck size={28} className="text-blue-500 mb-2" />
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Fast<br />Delivery</span>
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <RefreshCw size={28} className="text-purple-500 mb-2" />
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Easy<br />Returns</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <div className="pt-8 border-t border-slate-200 dark:border-dark-border">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Related Products</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {relatedProducts.map(rel => {
                            const isNew = rel.tags && rel.tags.includes('New Arrival');
                            const isRelOutOfStock = rel.availableStock <= 0;
                            return (
                                <motion.div
                                    key={rel.id}
                                    whileHover={{ y: -5 }}
                                    onClick={() => navigate(`/buyer/product/${rel.id}`, { state: { product: rel } })}
                                    className="cursor-pointer group bg-white dark:bg-dark-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-100 dark:border-dark-border transition-all duration-300 flex flex-col"
                                >
                                    <div className="relative h-48 bg-slate-100 dark:bg-dark-bg overflow-hidden">
                                        {getImageUrl(rel.image) ? (
                                            <img src={getImageUrl(rel.image)} alt={rel.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <Package size={32} />
                                            </div>
                                        )}
                                        {isNew && (
                                            <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-md">
                                                New
                                            </div>
                                        )}
                                        {isRelOutOfStock && (
                                            <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center">
                                                <span className="bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Out of Stock</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 flex flex-col flex-1">
                                        <h3 className="text-base font-semibold text-slate-800 dark:text-white line-clamp-1 group-hover:text-primary-600 transition-colors">
                                            {rel.name}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1 font-mono">{rel.code}</p>
                                        <div className="mt-auto pt-3 flex items-center justify-between">
                                            <p className="text-lg font-bold text-slate-800 dark:text-white">₹{formatPrice(rel.rate.toFixed(2))}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
