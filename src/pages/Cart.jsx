import React, { useState, useEffect } from 'react';
import { getCartApi, getTransportersApi, updateCartItemApi, removeCartItemApi, createOrderApi } from '../Action/api';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, Truck, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { TextField, MenuItem } from '@mui/material';

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

  const handleUpdateQuantity = async (itemId, currentQty, delta) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;

    try {
      await updateCartItemApi(itemId, { quantity: newQty });
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
      toast.error('Your cart is empty');
      return;
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
      toast.success('Order placed successfully!');
      window.dispatchEvent(new Event('cartUpdated'));
      window.dispatchEvent(new Event('ordersUpdated'));
      navigate('/buyer/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading cart...</div>;
  }

  const isEmpty = !cartData || !cartData.items || cartData.items.length === 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
        <ShoppingBag className="mr-3" /> Your Cart
      </h1>

      {isEmpty ? (
        <div className="bg-white dark:bg-dark-card p-12 text-center rounded-xl shadow-sm border border-slate-200 dark:border-dark-border">
          <ShoppingCart size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">Your cart is empty</h2>
          <p className="text-slate-500 mb-6">Looks like you haven't added any designs to your cart yet.</p>
          <button onClick={() => navigate('/buyer/designs')} className="btn btn-primary">
            Browse Designs
          </button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Cart Items */}
          <div className="flex-1 bg-white dark:bg-dark-card rounded-xl shadow-sm border border-slate-200 dark:border-dark-border overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-dark-border font-semibold text-slate-700 dark:text-slate-200">
              Items ({cartData.items.length})
            </div>
            <div className="divide-y divide-slate-100 dark:divide-dark-border">
              {cartData.items.map(item => (
                <div key={item.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-dark-border rounded-lg overflow-hidden shrink-0">
                    {item.design.image ? (
                      <img src={getImageUrl(item.design.image.split(',')[0].trim())} alt={item.design.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No Img</div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 dark:text-white">{item.design.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Code: {item.design.code}</p>
                    <p className="font-medium text-primary-600 dark:text-primary-400">₹{formatPrice(item.design.rate)} / unit</p>
                  </div>

                  <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
                    <div className="flex items-center border border-slate-200 dark:border-dark-border rounded-lg overflow-hidden">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                        className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-dark-bg dark:hover:bg-slate-800 transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <div className="w-12 text-center text-sm font-medium">{item.quantity}</div>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                        className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-dark-bg dark:hover:bg-slate-800 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                      <span className="font-bold text-slate-800 dark:text-white">
                        ₹{formatPrice((item.quantity * item.design.rate).toFixed(2))}
                      </span>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary & Checkout */}
          <div className="w-full lg:w-80 bg-white dark:bg-dark-card rounded-xl shadow-sm border border-slate-200 dark:border-dark-border h-fit">
            <div className="p-4 border-b border-slate-200 dark:border-dark-border font-semibold text-slate-700 dark:text-slate-200">
              Order Summary
            </div>

            <div className="p-4 space-y-4">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span>₹{formatPrice(subtotal.toFixed(2))}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 text-sm">
                <span>Estimated GST</span>
                <span>Calculated on checkout</span>
              </div>
              <div className="border-t border-slate-200 dark:border-dark-border pt-4 flex justify-between font-bold text-lg text-slate-800 dark:text-white">
                <span>Total</span>
                <span>₹{formatPrice(subtotal.toFixed(2))}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-dark-bg border-t border-slate-200 dark:border-dark-border space-y-4">
              <div>
                <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Truck size={16} className="mr-2" />
                  Select Transporter
                </label>
                <TextField
                  select
                  value={selectedTransporter === '' ? 'default' : selectedTransporter}
                  onChange={(e) => setSelectedTransporter(e.target.value === 'default' ? '' : e.target.value)}
                  fullWidth
                  className="bg-white dark:bg-dark-card"
                >
                  <MenuItem value="default">Buyer will arrange / Decide later</MenuItem>
                  {transporters.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                  <MenuItem value="other">Other (Specify Below)</MenuItem>
                </TextField>
              </div>

              {selectedTransporter === 'other' && (
                <div>
                  <TextField
                    label="Preferred Transporter Name"
                    value={customTransporter}
                    onChange={(e) => setCustomTransporter(e.target.value)}
                    placeholder="Enter the name of your preferred transporter"
                    fullWidth
                    className="bg-white dark:bg-dark-card mt-2"
                  />
                </div>
              )}

              <div>
                <TextField
                  label="Remarks"
                  multiline
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Any special instructions..."
                  fullWidth
                  className="bg-white dark:bg-dark-card mt-2"
                />
              </div>

              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full btn btn-primary py-3 flex justify-center items-center font-medium"
              >
                {isCheckingOut ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
