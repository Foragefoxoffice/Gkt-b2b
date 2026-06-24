import React, { useState, useEffect, useMemo } from 'react';
import { getCartApi, getTransportersApi, updateCartItemApi, removeCartItemApi, createOrderApi, createProductRequestApi, emailOrderPdfApi } from '../Action/api';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, Truck, ShoppingCart, PackageCheck, ArrowRight, ShieldCheck, RefreshCw, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import orderPlacedSound from '../assets/order_placed.mp3';
import TruckButton from '../components/TruckButton';
import { Select, MenuItem, TextField } from '@mui/material';
import ImageZoom from '../components/ImageZoom';
import { AlertTriangle } from 'lucide-react';
import { generateOrderPdf } from '../utils/generateOrderPdf';

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
    return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
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
  const [selectedImage, setSelectedImage] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestRemarks, setRequestRemarks] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const [orderGivenBy, setOrderGivenBy] = useState('');
  const [orderGivenByPhone, setOrderGivenByPhone] = useState('');
  const [signatureFile, setSignatureFile] = useState(null);

  const getColorImage = (design, color) => {
    if (!design || !color) return null;

    const imagesArray = design.image ? design.image.split(',').map(s => s.trim()) : [];

    try {
      if (design.imageColorMap) {
        const parsedMap = typeof design.imageColorMap === 'string' ? JSON.parse(design.imageColorMap) : design.imageColorMap;

        if (Array.isArray(parsedMap)) {
          const idx = parsedMap.findIndex(c => c === color);
          if (idx !== -1 && imagesArray[idx]) {
            return getImageUrl(imagesArray[idx]);
          }
        } else if (typeof parsedMap === 'object' && parsedMap !== null) {
          if (parsedMap[color]) {
            return getImageUrl(parsedMap[color]);
          }
        }
      }
    } catch (e) { }

    return null;
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleInventoryUpdate = () => {
      if (!isCheckingOut) {
        fetchData();
      }
    };

    window.addEventListener('inventoryUpdated', handleInventoryUpdate);
    return () => {
      window.removeEventListener('inventoryUpdated', handleInventoryUpdate);
    };
  }, [isCheckingOut]);

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
    if (max > 0 && newQty > max) {
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

  // Check if any cart items are out of stock
  const hasOutOfStockItems = useMemo(() => {
    if (!cartData || !cartData.items) return false;
    return cartData.items.some(item => getMaxQuantity(item) === 0);
  }, [cartData]);

  const outOfStockItemNames = useMemo(() => {
    if (!cartData || !cartData.items) return [];
    return cartData.items
      .filter(item => getMaxQuantity(item) === 0)
      .map(item => `${item.design?.name || 'Unknown'}${item.color ? ` (${item.color})` : ''}`);
  }, [cartData]);

  const handleCheckout = async () => {
    if (!cartData || cartData.items.length === 0) {
      toast.error('Cart is empty');
      return Promise.reject('empty');
    }

    // Block checkout if any items are out of stock
    if (hasOutOfStockItems) {
      toast.error('Some items are out of stock. Please submit a Production Request instead.');
      setShowRequestModal(true);
      return Promise.reject('out_of_stock');
    }

    setIsCheckingOut(true);
    try {
      let finalRemarks = remarks;
      if (selectedTransporter === 'other' && customTransporter.trim()) {
        finalRemarks = `Preferred Transporter: ${customTransporter}\n${remarks}`.trim();
      }

      const formData = new FormData();
      if (selectedTransporter !== 'default' && selectedTransporter !== 'other' && selectedTransporter !== '') {
        formData.append('transporterId', selectedTransporter);
      }
      formData.append('remarks', finalRemarks);
      if (orderGivenBy) formData.append('orderGivenBy', orderGivenBy);
      if (orderGivenByPhone) formData.append('orderGivenByPhone', orderGivenByPhone);
      if (signatureFile) formData.append('signature', signatureFile);

      const res = await createOrderApi(formData);
      const newOrder = res.data.data;

      try {
        const pdfBlob = await generateOrderPdf(newOrder, { returnBlob: true });
        if (pdfBlob) {
          const emailFormData = new FormData();
          emailFormData.append('orderPdf', pdfBlob, `Order_${newOrder.orderNumber}.pdf`);
          await emailOrderPdfApi(newOrder.id, emailFormData);
        }
      } catch (pdfErr) {
        console.error("Failed to generate and email PDF", pdfErr);
      }

      window.dispatchEvent(new Event('cartUpdated'));
      window.dispatchEvent(new Event('ordersUpdated'));
      return Promise.resolve();
    } catch (err) {
      const errMsg = err.response?.data?.message || '';
      if (errMsg.includes('Insufficient stock') || errMsg.includes('stock')) {
        toast.error(errMsg);
        setShowRequestModal(true);
      } else {
        toast.error(errMsg || 'Failed to place order');
      }
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
    <div className="mx-auto pb-16 px-4 sm:px-6 lg:px-8">
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
                {Object.values(cartData.items.reduce((acc, item) => {
                  if (!acc[item.design.id]) acc[item.design.id] = { design: item.design, items: [], totalQuantity: 0, totalPrice: 0 };
                  acc[item.design.id].items.push(item);
                  acc[item.design.id].totalQuantity += item.quantity;
                  acc[item.design.id].totalPrice += item.quantity * item.design.rate;
                  return acc;
                }, {})).map((group, index) => (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={group.design.id}
                    className="p-6 flex flex-col sm:flex-row gap-6 hover:bg-slate-50/20 dark:hover:bg-dark-bg/20 transition-colors"
                  >
                    <div className="w-full sm:w-32 h-32 bg-slate-100 dark:bg-dark-bg rounded-2xl overflow-hidden shrink-0 border border-slate-200/50 dark:border-dark-border">
                      {group.design.image ? (
                        <img
                          src={getImageUrl(group.design.image.split(',')[0].trim())}
                          alt={group.design.name}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setSelectedImage(getImageUrl(group.design.image.split(',')[0].trim()))}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No Image</div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
                            {group.design.name}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm font-mono text-slate-500 bg-slate-100 dark:bg-dark-border px-2 py-0.5 rounded">
                              {group.design.code}
                            </span>
                          </div>
                        </div>
                        <p className="font-bold text-lg text-slate-800 dark:text-white">
                          ₹{formatPrice(group.design.rate)} <span className="text-sm text-slate-500 font-normal">/ unit</span>
                        </p>
                      </div>

                      <div className="mt-4 space-y-3">
                        {group.items.map(item => (
                          <div key={item.id} className="flex flex-wrap items-center justify-between bg-slate-50 dark:bg-dark-bg/50 p-2.5 rounded-xl border border-slate-100 dark:border-dark-border/50">
                            <div className="flex items-center gap-3 mb-2 sm:mb-0">
                              {item.color ? (
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-3">
                                  {(() => {
                                    const colorImg = getColorImage(group.design, item.color);
                                    if (colorImg) {
                                      return (
                                        <div
                                          className="w-20 h-20 rounded bg-white overflow-hidden border border-slate-200 dark:border-dark-border shadow-sm shrink-0 cursor-pointer hover:shadow-md transition-shadow"
                                          onClick={() => setSelectedImage(colorImg)}
                                        >
                                          <img src={colorImg} alt={item.color} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                                        </div>
                                      );
                                    }
                                    return <div className="w-4 h-4 rounded-full border border-slate-300 shadow-sm shrink-0" style={{ backgroundColor: item.color.toLowerCase() }}></div>;
                                  })()}
                                  <span className="font-semibold">{item.color}</span>
                                  {getMaxQuantity(item) === 0 && (
                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/30 ml-2">
                                      Request Production
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-sm font-medium text-slate-500 italic">
                                  Default Color
                                  {getMaxQuantity(item) === 0 && (
                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/30 ml-2">
                                      Request Production
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-end">
                              <div className="flex items-center bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-lg overflow-hidden shadow-sm h-9">
                                <button
                                  onClick={() => handleUpdateQuantity(item, -1)}
                                  className={`px-3 h-full flex items-center transition-colors ${item.quantity <= 1 ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-500 hover:text-primary-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus size={14} />
                                </button>
                                <div className="w-10 text-center font-semibold text-sm text-slate-800 dark:text-white">{item.quantity}</div>
                                <button
                                  onClick={() => handleUpdateQuantity(item, 1)}
                                  className={`px-3 h-full flex items-center transition-colors ${(getMaxQuantity(item) > 0 && item.quantity >= getMaxQuantity(item)) ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-500 hover:text-primary-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                  disabled={getMaxQuantity(item) > 0 && item.quantity >= getMaxQuantity(item)}
                                >
                                  <Plus size={14} />
                                </button>
                              </div>

                              <div className="text-right min-w-[80px]">
                                <span className="font-semibold text-primary-600 dark:text-primary-400">
                                  ₹{formatPrice((item.quantity * group.design.rate).toFixed(2))}
                                </span>
                              </div>

                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                title="Remove color"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-3 flex justify-end items-center border-t border-slate-100 dark:border-dark-border/50">
                        <span className="text-sm text-slate-500 mr-3">Subtotal ({group.totalQuantity} items):</span>
                        <span className="font-bold text-lg text-slate-800 dark:text-white">₹{formatPrice(group.totalPrice.toFixed(2))}</span>
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
            <div className="bg-slate-50 dark:bg-dark-card rounded-3xl p-6 sm:p-6 border border-slate-200 dark:border-dark-border sticky top-20">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200 dark:border-dark-border">
                <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg text-primary-600 dark:text-primary-400">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-800 dark:text-white leading-tight">
                    Requirement Order Form
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">Please review details before placing the order</p>
                </div>
              </div>

              {cartData?.buyer && (
                <div className="mb-6 bg-white dark:bg-dark-bg p-4 rounded-2xl border border-slate-200 dark:border-dark-border shadow-sm space-y-4">
                  {/* FROM Address (Company) */}
                  <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 rounded-l-full"></div>
                    <div className="pl-4">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-xs font-semibold text-[#e2148dc4] uppercase tracking-wider">From (Seller)</h3>
                        {cartData.buyer.firm?.company?.logo && (
                          <img src={getImageUrl(cartData.buyer.firm.company.logo)} alt="Logo" className="h-8 w-auto object-contain bg-slate-50 dark:bg-slate-800 rounded px-1" />
                        )}
                      </div>
                      <div className="font-semibold text-slate-800 dark:text-white text-base">
                        {cartData.buyer.firm?.company?.name || 'The Madras Silks'}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {cartData.buyer.firm?.company?.address || 'Unit Of The Madras Silks India (P) Ltd, Chennai'}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                        {cartData.buyer.firm?.company?.gst && (
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">GST:</span> {cartData.buyer.firm?.company?.gst}
                          </div>
                        )}
                        {cartData.buyer.firm?.company?.phone && (
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">Ph:</span> {cartData.buyer.firm?.company?.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-dark-border/50"></div>

                  {/* TO Address (Buyer) */}
                  <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-full"></div>
                    <div className="pl-4">
                      <h3 className="text-xs font-semibold text-[#e2148dc4] uppercase tracking-wider mb-1">To (Buyer)</h3>
                      <div className="font-semibold text-slate-800 dark:text-white text-base flex items-center justify-between">
                        {cartData.buyer.name}
                        <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded font-bold uppercase">
                          {cartData.buyer.firm?.name || 'Firm'}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {cartData.buyer.billingAddress || cartData.buyer.firm?.address || 'No Address Provided'}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                        {(cartData.buyer.gst || cartData.buyer.firm?.gstNumber) && (
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">GST:</span> {cartData.buyer.gst || cartData.buyer.firm?.gstNumber}
                          </div>
                        )}
                        {(cartData.buyer.mobile || cartData.buyer.firm?.mobile) && (
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">Ph:</span> {cartData.buyer.mobile || cartData.buyer.firm?.mobile}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-slate-100 dark:bg-dark-bg/50 rounded-xl p-4 mb-6 border border-slate-200 dark:border-dark-border/50">
                <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between items-center">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-800 dark:text-white">₹{formatPrice(subtotal.toFixed(2))}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Estimated GST</span>
                    <span className="text-slate-500 italic text-xs">Calculated on checkout</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-dark-border pt-6 mb-8 flex justify-between items-end">
                <span className="text-lg font-semibold text-slate-800 dark:text-white">Total</span>
                <span className="text-2xl font-semibold text-primary-600 dark:text-primary-400 leading-none">
                  ₹{formatPrice(subtotal.toFixed(2))}
                </span>
              </div>

              <div className="space-y-6">
                {!hasOutOfStockItems && (
                  <>
                    <div>
                      <label className="flex items-center text-md font-semibold text-slate-700 dark:text-slate-300 mb-3">
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
                        {transporters.map(t => (
                          <MenuItem key={t.id} value={t.id}>
                            {t.name} {t.gstNumber ? `(GST: ${t.gstNumber})` : ''}
                          </MenuItem>
                        ))}
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
                  </>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Order Given By
                    </label>
                    <TextField
                      fullWidth
                      value={orderGivenBy}
                      onChange={(e) => setOrderGivenBy(e.target.value)}
                      placeholder="Name of the person"
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
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <TextField
                      fullWidth
                      value={orderGivenByPhone}
                      onChange={(e) => setOrderGivenByPhone(e.target.value)}
                      placeholder="Phone number"
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

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Signature (Optional)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSignatureFile(e.target.files[0]);
                        }
                      }}
                      className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-primary-50 file:text-primary-700
                        hover:file:bg-primary-100 dark:file:bg-primary-900/30 dark:file:text-primary-400
                        cursor-pointer"
                    />
                    {signatureFile && (
                      <button
                        type="button"
                        onClick={() => setSignatureFile(null)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium shrink-0"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
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

              {/* Checkout / Request Production Buttons */}
              <div className="mt-8">
                {hasOutOfStockItems ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl">
                      <AlertTriangle size={20} className="text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Out of Stock Items</p>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                          {outOfStockItemNames.join(', ')} {outOfStockItemNames.length === 1 ? 'is' : 'are'} currently out of stock. Submit a production request to notify the admin.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowRequestModal(true)}
                      className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl shadow-sm shadow-amber-500/30 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
                    >
                      <Zap size={20} />
                      Request Production
                    </button>
                  </div>
                ) : (
                  <TruckButton
                    apiCall={handleCheckout}
                    onComplete={handleAnimationComplete}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Production Request Modal */}
      <AnimatePresence>
        {showRequestModal && (
          <div className="fixed modal_main inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setShowRequestModal(false)}
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white dark:bg-dark-card rounded-3xl shadow-2xl p-8 max-w-lg w-full border border-slate-100 dark:border-dark-border"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl">
                  <ShoppingCart size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Submit Production Request</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Request custom weaving for out-of-stock items</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  Some items in your cart do not have enough stock. You can submit a production request to notify the administrator. Please fill in any specific instructions or requirements (e.g. quantity adjustments, delivery dates):
                </p>

                <div className="max-h-40 overflow-y-auto mb-4 border border-slate-100 dark:border-dark-border/50 rounded-xl divide-y divide-slate-50 dark:divide-dark-border/50 p-2">
                  {cartData?.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center py-2 text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {item.design?.name} ({item.color || 'Default Color'})
                      </span>
                      <span className="text-slate-500">
                        Requested: {item.quantity} units
                      </span>
                    </div>
                  ))}
                </div>

                <label className="block text-sm font-semibold text-[#e2148d] mb-2">
                  Needed Product Details & Remarks
                </label>
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  value={requestRemarks}
                  onChange={(e) => setRequestRemarks(e.target.value)}
                  placeholder="Enter details of color variations, specifications, or preferred loom timeline..."
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '0.75rem',
                      '& fieldset': { borderColor: '#e2e8f0' },
                      '&:hover fieldset': { borderColor: '#cbd5e1' },
                      '&.Mui-focused fieldset': { borderColor: '#d97706', borderWidth: '2px' },
                    }
                  }}
                  className="bg-slate-50 dark:bg-dark-bg text-slate-700 dark:text-slate-200"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmittingRequest}
                  onClick={async () => {
                    setIsSubmittingRequest(true);
                    try {
                      await createProductRequestApi({ remarks: requestRemarks });
                      toast.success('Production request submitted successfully');
                      setShowRequestModal(false);
                      window.dispatchEvent(new Event('cartUpdated'));
                      navigate('/buyer/orders');
                    } catch (err) {
                      toast.error(err.response?.data?.message || 'Failed to submit request');
                    } finally {
                      setIsSubmittingRequest(false);
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-sm transition-all font-medium disabled:opacity-50"
                >
                  {isSubmittingRequest ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                className="text-2xl font-semibold text-slate-800 dark:text-white mb-3"
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
