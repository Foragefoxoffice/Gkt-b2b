import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getDesignByIdApi, addToCartApi, getCartApi } from '../Action/api';
import { ShoppingCart, ArrowLeft, Plus, Minus, Package, Check, Sparkles, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import ImageZoom from '../components/ImageZoom';

const VariantCard = ({ product, color, stock, image, cartItems, onCartUpdated, onImageClick }) => {
    const [quantity, setQuantity] = useState(1);

    const isAdded = useMemo(() => {
        return cartItems.some(item =>
            item.designId === product.id &&
            (item.color === color || (!item.color && !color))
        );
    }, [cartItems, product.id, color]);

    const maxQuantity = stock !== undefined ? parseInt(stock) : parseInt(product.availableStock);
    const outOfStock = maxQuantity <= 0;
    const maxAllowed = outOfStock ? 99999 : maxQuantity;

    const handleAddToCart = async () => {
        try {
            await addToCartApi({
                designId: product.id,
                quantity: quantity,
                color: color || undefined
            });
            toast.success(`${product.name} ${color ? `(${color})` : ''} added to cart!`);
            onCartUpdated();
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

    const getValidColor = (cName) => {
        if (!cName) return '#e2e8f0';
        // Handle common variations
        let c = cName.toLowerCase().replace(/\s+/g, '');
        if (c === 'melange') return '#808080';
        return c;
    };

    const getBgStyle = () => {
        if (!color) return '#e2e8f0';
        if (color.includes('+')) {
            const parts = color.split('+');
            return `linear-gradient(135deg, ${getValidColor(parts[0])} 50%, ${getValidColor(parts[1])} 50%)`;
        }
        return getValidColor(color);
    };

    return (
        <div className="bg-white dark:bg-dark-card rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-dark-border flex flex-col group hover:shadow-xl transition-all duration-300">
            {/* Image or Color Swatch */}
            <div className="relative aspect-[5/5] bg-slate-50 dark:bg-dark-bg overflow-hidden flex items-center justify-center">
                {image ? (
                    <img src={image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                        <div
                            className="w-20 h-20 rounded-full border-4 border-white dark:border-dark-border shadow-md mb-4 transform group-hover:scale-110 transition-transform duration-500"
                            style={{ background: getBgStyle() }}
                        />
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center px-2">
                            {color || 'No Image'}
                        </span>
                    </div>
                )}

                {/* Hover overlay with Eye icon */}
                {image && (
                    <button
                        onClick={() => onImageClick(image)}
                        className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                    >
                        <div className="bg-white/90 p-3 rounded-full text-slate-800 shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            <Eye size={20} />
                        </div>
                    </button>
                )}

                {outOfStock && (
                    <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center z-20 pointer-events-none">
                        <span className="bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg">Out of Stock</span>
                    </div>
                )}
            </div>

            {/* Details */}
            <div className="p-3.5 flex flex-col flex-1">
                <div className="mb-0">
                    <span className="text-[10px] font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400 px-2 py-1 rounded-md uppercase tracking-wider mb-1.5 inline-block">
                        {color ? color : product.designcategory?.name || 'Design'}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white line-clamp-1">{product.name}</h3>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">Code: {product.code}</p>
                </div>

                <div className="flex items-end mb-1">
                    <p className="text-base font-bold text-slate-800 dark:text-white">₹{formatPrice(product.rate.toFixed(2))}</p>
                    <p className="text-[10px] text-slate-500 ml-1 mb-0.5">+{product.gstPercent}% GST</p>
                </div>

                {/* Stock info */}
                <div className="mb-3">
                    <p className={`text-[11px] font-medium ${outOfStock ? 'text-amber-600' : 'text-emerald-500'}`}>
                        {outOfStock ? 'Production Order Only' : `${maxQuantity} Available`}
                    </p>
                </div>

                {/* Actions */}
                <div className="mt-auto space-y-2.5">
                    {/* Quantity */}
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-dark-bg rounded-lg p-0 border border-slate-100 dark:border-dark-border">
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            disabled={quantity <= 1}
                            className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${quantity <= 1 ? 'text-slate-300 dark:text-slate-600' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        >
                            <Minus size={14} />
                        </button>
                        <span className="text-xs font-semibold text-slate-800 dark:text-white w-6 text-center">
                            {quantity}
                        </span>
                        <button
                            onClick={() => setQuantity(Math.min(maxAllowed, quantity + 1))}
                            disabled={quantity >= maxAllowed}
                            className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${quantity >= maxAllowed ? 'text-slate-300 dark:text-slate-600' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    {/* Add Button */}
                    <motion.button
                        whileTap={isAdded ? {} : { scale: 0.97 }}
                        onClick={handleAddToCart}
                        disabled={isAdded}
                        className={`w-full py-2.5 text-xs font-medium rounded-lg flex items-center justify-center transition-all ${isAdded
                            ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                            : outOfStock
                                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                                : 'bg-primary-600 hover:bg-primary-500 text-white shadow-sm shadow-primary-500/20'}`}
                    >
                        {isAdded ? (
                            <>
                                <Check size={14} className="mr-1.5" />
                                Added
                            </>
                        ) : outOfStock ? (
                            <>
                                <ShoppingCart size={14} className="mr-1.5" />
                                Add for Production
                            </>
                        ) : (
                            <>
                                <ShoppingCart size={14} className="mr-1.5" />
                                Add to Cart
                            </>
                        )}
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

export default function ProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [product, setProduct] = useState(location.state?.product || null);
    const [loading, setLoading] = useState(!product);
    const [cartItems, setCartItems] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchProduct();
        fetchCart();

        const handleInventoryUpdate = () => {
            fetchProduct();
        };

        window.addEventListener('inventoryUpdated', handleInventoryUpdate);
        return () => {
            window.removeEventListener('inventoryUpdated', handleInventoryUpdate);
        };
    }, [id]);

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

    const fetchProduct = async () => {
        try {
            const res = await getDesignByIdApi(id);
            setProduct(res.data.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load product details');
        } finally {
            setLoading(false);
        }
    };

    const getImageUrl = (imageString) => {
        if (!imageString) return null;
        const firstImage = imageString.split(',')[0].trim().replace(/\\/g, '/');
        return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${firstImage}`;
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
                <button onClick={() => navigate('/buyer/designs')} className="text-primary-600 hover:underline flex items-center justify-center mx-auto">
                    <ArrowLeft className="mr-2" size={18} /> Back to Gallery
                </button>
            </div>
        );
    }

    // Process Variants
    let colors = [];
    let stockMap = {};
    let imageMap = {};

    if (product.colorStock) {
        try {
            const parsed = typeof product.colorStock === 'string' ? JSON.parse(product.colorStock) : product.colorStock;
            colors = Object.keys(parsed);
            stockMap = parsed;
        } catch (e) {
            colors = product.color ? [product.color] : [];
        }
    } else if (product.color) {
        colors = [product.color];
    }

    const imagesArray = product.image ? product.image.split(',').map(s => s.trim()) : [];
    if (product.imageColorMap) {
        try {
            const parsedColors = typeof product.imageColorMap === 'string' ? JSON.parse(product.imageColorMap) : product.imageColorMap;
            if (Array.isArray(parsedColors)) {
                parsedColors.forEach((c, idx) => {
                    if (c && imagesArray[idx]) {
                        imageMap[c] = imagesArray[idx];
                    }
                });
            } else if (typeof parsedColors === 'object' && parsedColors !== null) {
                imageMap = parsedColors;
            }
        } catch (e) { }
    }

    const mainImage = imagesArray.length > 0 ? getImageUrl(imagesArray[0]) : null;

    const variants = colors.length > 0 ? colors.map((c, idx) => {
        let variantImg = null;
        if (imageMap[c]) {
            variantImg = getImageUrl(imageMap[c]);
        }
        return {
            color: c,
            stock: stockMap[c],
            image: variantImg
        };
    }) : [{
        color: null,
        stock: product.availableStock,
        image: mainImage
    }];

    return (
        <div className="max-w-7xl mx-auto pb-16 px-4 space-y-8 mt-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-dark-card p-6 md:p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-dark-border relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Sparkles size={120} />
                </div>
                <div className="relative z-10">
                    <button
                        onClick={() => navigate('/buyer/designs')}
                        className="flex items-center text-slate-500 hover:text-primary-600 transition-colors font-medium mb-4"
                    >
                        <ArrowLeft size={18} className="mr-2" /> Back to Gallery
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl md:text-3xl font-semibold text-slate-800 dark:text-white tracking-tight">
                            {product.name}
                        </h1>
                        <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold uppercase tracking-wider rounded-lg">
                            {product.code}
                        </span>
                    </div>
                    <p className="text-slate-500 mt-2 text-sm md:text-base">
                        Select a sub-product (color) from the grid below and add to your cart.
                    </p>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4">
                {variants.map((v, i) => (
                    <VariantCard
                        key={i}
                        product={product}
                        color={v.color}
                        stock={v.stock}
                        image={v.image}
                        cartItems={cartItems}
                        onCartUpdated={() => {
                            fetchCart();
                            window.dispatchEvent(new Event('cartUpdated'));
                        }}
                        onImageClick={setSelectedImage}
                    />
                ))}
            </div>

            {/* Quick View Lightbox */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed modal_main inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
                        onClick={() => setSelectedImage(null)}
                    >
                        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl"></div>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative max-w-4xl w-full max-h-[90vh] bg-transparent flex items-center justify-center"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="absolute -top-12 right-0 md:-right-[-120px] z-10 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                            <ImageZoom src={selectedImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain drop-shadow-2xl rounded-2xl" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
