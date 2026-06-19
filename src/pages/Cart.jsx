import React, { useState, useEffect } from 'react';
import { getCartApi, getTransportersApi, updateCartItemApi, removeCartItemApi, createOrderApi } from '../Action/api';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, Truck, ShoppingCart, PackageCheck, ChevronDown, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import orderPlacedSound from '../assets/order_placed.mp3';
import TruckButton from '../components/TruckButton';
import { Select, MenuItem, TextField } from '@mui/material';

const Cart = () => {
  const { token } = useSelector(state => state.auth);
  const navigate = useNavigate();

  const [cartData, setCartData] = useState(null);
  const [subtotal, setSubtotal] = useState(0);
  const [transporters, setTransporters] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Checkout form
  const [selectedTransporter, setSelectedTransporter] = useState('default');
  const [customTransporter, setCustomTransporter] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cartRes, transRes] = await Promise.all([
        getCartApi(),
        getTransportersApi()
      ]);
      setCartData(cartRes.data.data.cart);
      setSubtotal(cartRes.data.data.subtotal);
      setTransporters(transRes.data.data);
    } catch (err) {
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const getMaxQuantity = (item) => {
    let max = parseInt(item.design?.availableStock || 0);
    if (item.color && item.design?.colorStock) {
      try {
        const parsed = typeof item.design.colorStock === 'string' 
          ? JSON.parse(item.design.colorStock) 
          : item.design.colorStock;
        if (parsed[item.color] !== undefined) {
          max = parseInt(parsed[item.color]);
        }
      } catch (e) {
        // ignore
      }
    }
    return max;
  };

  const handleUpdateQuantity = async (item, delta) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;

    const max = getMaxQuantity(item);
    if (newQty > max) {
      toast.error('Maximum available stock reached');
      return;
    }

    try {
      await updateCartItemApi(item.id, { quantity: newQty });
      fetchData(); // Refresh cart to get new subtotal
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update quantity');
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await removeCartItemApi(itemId);
      toast.success('Item removed');
      fetchData();
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  const handleCheckout = async () => {
    if (!cartData || cartData.items.length === 0) {
      toast.error('Cart is empty');
      return Promise.reject('empty');
    }

    setIsCheckingOut(true);
    try {
      let finalRemarks = remarks;
      if (selectedTransporter === 'other' && customTransporter.trim()) {
        finalRemarks = `Preferred Transporter: ${customTransporter}\n${remarks}`.trim();
      }

      await createOrderApi({
        transporterId: (selectedTransporter === 'default' || selectedTransporter === 'other') ? null : selectedTransporter,
        remarks: finalRemarks
      });
      window.dispatchEvent(new Event('cartUpdated'));
      window.dispatchEvent(new Event('ordersUpdated'));
      return Promise.resolve();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
      setIsCheckingOut(false);
      return Promise.reject(err);
    }
  };

  const handleAnimationComplete = () => {
    const audio = new Audio(orderPlacedSound);
    audio.play().catch(e => console.log('Audio playback failed:', e));
    setShowSuccessModal(true);
    setTimeout(() => {
      navigate('/buyer/orders');
    }, 3500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const isEmpty = !cartData || !cartData.items || cartData.items.length === 0;

  return (
    <div className="max-w-7xl mx-auto pb-16 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl sm:text-2xl font-semibold text-slate-800 dark:text-white flex items-center">
          <ShoppingBag className="mr-2 text-primary-600" size={26} />
          Shopping Cart
        </h1>
        <p className="text-slate-500 mt-2">Review your items and proceed to checkout securely.</p>
      </div>

      {isEmpty ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-dark-card py-20 px-8 text-center rounded-3xl shadow-sm border border-slate-100 dark:border-dark-border"
        >
          <div className="w-32 h-32 bg-slate-50 dark:bg-dark-bg rounded-full flex items-center justify-center mx-auto mb-3">
            <ShoppingCart size={64} className="text-slate-300 dark:text-slate-600" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-3">Your cart is empty</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
            Looks like you haven't added any designs to your cart yet. Discover our latest collections!
          </p>
          <button
            onClick={() => navigate('/buyer/products')}
            className="bg-primary-600 hover:bg-primary-500 text-white px-8 py-4 rounded-xl font-medium shadow-sm shadow-primary-500/30 transition-all flex items-center mx-auto"
          >
            Browse Products <ArrowRight className="ml-2" size={20} />
          </button>
        </motion.div>
      ) : (
        <div className="lg:grid lg:grid-cols-12 lg:gap-10">

          {/* Cart Items */}
          <div className="lg:col-span-7 xl:col-span-8 mb-10 lg:mb-0">
            <div className="bg-white dark:bg-dark-card rounded-3xl shadow-sm border border-slate-100 dark:border-dark-border overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-dark-border flex justify-between items-center bg-slate-50/50 dark:bg-dark-bg/50">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Items ({cartData.items.length})
                </h2>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-dark-border">
                {cartData.items.map((item, index) => (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={item.id}
                    className="p-6 flex flex-col sm:flex-row gap-6 hover:bg-slate-50/50 dark:hover:bg-dark-bg/50 transition-colors"
                  >
                    <div className="w-full sm:w-32 h-32 bg-slate-100 dark:bg-dark-bg rounded-2xl overflow-hidden shrink-0 border border-slate-200/50 dark:border-dark-border">
                      {item.design.image ? (
                        <img src={getImageUrl(item.design.image.split(',')[0].trim())} alt={item.design.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No Image</div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
                            {item.design.name}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm font-mono text-slate-500 bg-slate-100 dark:bg-dark-border px-2 py-0.5 rounded">
                              {item.design.code}
                            </span>
                            {item.color && (
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-dark-border px-2 py-0.5 rounded-full flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-slate-400" style={{ backgroundColor: item.color.toLowerCase() }}></div>
                                {item.color}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="font-bold text-lg text-slate-800 dark:text-white">
                          ₹{formatPrice(item.design.rate)} <span className="text-sm text-slate-500 font-normal">/ unit</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-4 sm:mt-auto">
                        <div className="flex items-center bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl overflow-hidden shadow-sm">
                          <button
                            onClick={() => handleUpdateQuantity(item, -1)}
                            className={`p-3 transition-colors ${item.quantity <= 1 ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-500 hover:text-primary-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={16} />
                          </button>
                          <div className="w-12 text-center font-semibold text-slate-800 dark:text-white">{item.quantity}</div>
                          <button
                            onClick={() => handleUpdateQuantity(item, 1)}
                            className={`p-3 transition-colors ${item.quantity >= getMaxQuantity(item) ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-500 hover:text-primary-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            disabled={item.quantity >= getMaxQuantity(item)}
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-emerald-600 mb-0.5">Total</p>
                            <span className="font-semibold text-xl text-primary-600 dark:text-primary-400">
                              ₹{formatPrice((item.quantity * item.design.rate).toFixed(2))}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="w-10 mt-3 h-10 rounded-full flex items-center justify-center text-red-500 bg-red-50 dark:bg-red-900/20 transition-all"
                            title="Remove item"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 dark:bg-dark-card p-4 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-200 dark:border-dark-border">
                <ShieldCheck className="text-emerald-500 mb-2" size={24} />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Secure<br />Checkout</span>
              </div>
              <div className="bg-slate-50 dark:bg-dark-card p-4 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-200 dark:border-dark-border">
                <Truck className="text-blue-500 mb-2" size={24} />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Reliable<br />Delivery</span>
              </div>
              <div className="bg-slate-50 dark:bg-dark-card p-4 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-200 dark:border-dark-border">
                <RefreshCw className="text-purple-500 mb-2" size={24} />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Easy<br />Returns</span>
              </div>
              <div className="bg-slate-50 dark:bg-dark-card p-4 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-200 dark:border-dark-border">
                <PackageCheck className="text-orange-500 mb-2" size={24} />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Quality<br />Assurance</span>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="bg-slate-50 dark:bg-dark-card rounded-3xl p-6 sm:p-6 border border-slate-200 dark:border-dark-border sticky top-6">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6 text-slate-600 dark:text-slate-400">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800 dark:text-white">₹{formatPrice(subtotal.toFixed(2))}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Estimated GST</span>
                  <span className="text-slate-500">Calculated on checkout</span>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-dark-border pt-6 mb-8 flex justify-between items-end">
                <span className="text-lg font-semibold text-slate-800 dark:text-white">Total</span>
                <span className="text-2xl font-semibold text-primary-600 dark:text-primary-400 leading-none">
                  ₹{formatPrice(subtotal.toFixed(2))}
                </span>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="flex items-center text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">
                    <Truck size={16} className="mr-2 text-primary-500" />
                    Transporter
                  </label>
                  <Select
                    value={selectedTransporter === '' ? 'default' : selectedTransporter}
                    onChange={(e) => setSelectedTransporter(e.target.value === 'default' ? '' : e.target.value)}
                    displayEmpty
                    fullWidth
                    sx={{
                      borderRadius: '0.75rem',
                      '.MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#d97706', borderWidth: '2px' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                      '.MuiSelect-select': { py: 1.5, px: 2, fontWeight: 500 }
                    }}
                    className="bg-white dark:bg-dark-bg text-slate-700 dark:text-slate-200"
                  >
                    <MenuItem value="default">Buyer will arrange / Decide later</MenuItem>
                    {transporters.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                    <MenuItem value="other">Other (Specify Below)</MenuItem>
                  </Select>
                </div>

                {selectedTransporter === 'other' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <TextField
                      fullWidth
                      value={customTransporter}
                      onChange={(e) => setCustomTransporter(e.target.value)}
                      placeholder="Enter preferred transporter name..."
                      variant="outlined"
                      sx={{
                        mt: 2,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '0.75rem',
                          '& fieldset': { borderColor: '#e2e8f0' },
                          '&:hover fieldset': { borderColor: '#cbd5e1' },
                          '&.Mui-focused fieldset': { borderColor: '#d97706', borderWidth: '2px' },
                        },
                        '& .MuiInputBase-input': { py: 1.5, px: 2 }
                      }}
                      className="bg-white dark:bg-dark-bg text-slate-700 dark:text-slate-200"
                    />
                  </motion.div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">
                    Remarks (Optional)
                  </label>
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Any special instructions for the order..."
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '0.75rem',
                        '& fieldset': { borderColor: '#e2e8f0' },
                        '&:hover fieldset': { borderColor: '#cbd5e1' },
                        '&.Mui-focused fieldset': { borderColor: '#d97706', borderWidth: '2px' },
                      }
                    }}
                    className="bg-white dark:bg-dark-bg text-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Checkout Button */}
              <div className="mt-4">
                <TruckButton
                  apiCall={handleCheckout}
                  onComplete={handleAnimationComplete}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed modal_main inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white dark:bg-dark-card rounded-3xl shadow-2xl p-10 max-w-md w-full text-center border border-slate-100 dark:border-dark-border"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", damping: 15, stiffness: 200 }}
                className="w-28 h-28 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <PackageCheck size={56} className="text-emerald-600 dark:text-emerald-400" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold text-slate-800 dark:text-white mb-3"
              >
                Order Placed!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed"
              >
                Thank you for your order. Your items are being processed and we will update you shortly.
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <div className="animate-pulse text-sm text-primary-600 font-medium">
                  Redirecting to your orders...
                </div>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Cart;
