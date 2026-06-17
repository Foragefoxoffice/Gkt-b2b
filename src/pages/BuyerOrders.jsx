import React, { useState, useEffect } from 'react';
import { getOrdersApi, updateOrderStatusApi, getOrderByIdApi, addToCartApi } from '../Action/api';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Clock, Eye, RefreshCw, ShoppingCart, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const BuyerOrders = () => {
  const { token } = useSelector(state => state.auth);
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getOrdersApi();
      setOrders(res.data.data);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await updateOrderStatusApi(orderId, { status: 'CANCELLED', remarks: 'Cancelled by buyer' });
      toast.success('Order cancelled');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleViewOrder = async (orderId) => {
    try {
      const res = await getOrderByIdApi(orderId);
      setSelectedOrder(res.data.data);
    } catch (err) {
      toast.error('Failed to load order details');
    }
  };

  const handleRepeatOrder = async (order) => {
    try {
      const res = await getOrderByIdApi(order.id);
      const orderDetails = res.data.data;

      let successCount = 0;
      for (const item of orderDetails.items) {
        try {
          await addToCartApi({ designId: item.designId, quantity: item.quantity });
          successCount++;
        } catch (e) {
          console.error('Failed to add item', item.designId);
        }
      }

      if (successCount > 0) {
        toast.success(`Added ${successCount} items to cart`);
        navigate('/buyer/cart');
      } else {
        toast.error('Could not add any items to cart (they may be out of stock)');
      }
    } catch (err) {
      toast.error('Failed to repeat order');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'APPROVED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'PROCESSING': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
        <Clock className="mr-3" /> Order History
      </h1>

      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-slate-200 dark:border-dark-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-500">You have not placed any orders yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-dark-bg border-b border-slate-200 dark:border-dark-border">
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Order No.</th>
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Date</th>
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Total Amount</th>
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-dark-bg/50 transition-colors">
                    <td className="p-4 font-medium text-slate-800 dark:text-white">{order.orderNumber}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{new Date(order.orderDate).toLocaleDateString()}</td>
                    <td className="p-4 font-medium text-primary-600 dark:text-primary-400">₹{order.grandTotal.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 flex justify-end space-x-2">
                      <button onClick={() => handleViewOrder(order.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => handleRepeatOrder(order)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Repeat Order (Add to Cart)">
                        <RefreshCw size={18} />
                      </button>
                      {order.status === 'PENDING' && (
                        <button onClick={() => handleCancelOrder(order.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Cancel Order">
                          <XCircle size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed modal_main mt-0 inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 dark:border-dark-border flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/20 shrink-0">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                Order Details: {selectedOrder.orderNumber}
              </h2>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 hover:bg-slate-100 dark:hover:bg-dark-bg rounded-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50/50 dark:bg-dark-bg/30 p-5 rounded-xl border border-slate-100 dark:border-dark-border">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Order Date</p>
                  <p className="font-semibold text-slate-800 dark:text-white">{new Date(selectedOrder.orderDate).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Status</p>
                  <p><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</span></p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Transporter</p>
                  <p className="font-semibold text-slate-800 dark:text-white">{selectedOrder.transporter?.name || 'Not Assigned'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Buyer Remarks</p>
                  <p className="font-semibold text-slate-800 dark:text-white">{selectedOrder.remarks || 'None'}</p>
                </div>
                {selectedOrder.approvals && selectedOrder.approvals.length > 0 && selectedOrder.approvals[0].remarks && (
                  <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-dark-border mt-2">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Admin Remarks</p>
                    <p className="font-semibold text-slate-800 dark:text-white">{selectedOrder.approvals[0].remarks}</p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center">
                  <span className="bg-primary-100 text-primary-700 p-1.5 rounded-lg mr-2"><ShoppingCart size={16} /></span>
                  Items
                </h3>
                <div className="border border-slate-200 dark:border-dark-border rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-dark-bg border-b border-slate-200 dark:border-dark-border">
                      <tr>
                        <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Design</th>
                        <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Qty</th>
                        <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Rate</th>
                        <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                      {selectedOrder.items.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-bg/50 transition-colors">
                          <td className="p-4">
                            <p className="font-bold text-slate-800 dark:text-slate-200">{item.design.name}</p>
                            <p className="text-xs text-slate-500 font-medium">{item.design.code}</p>
                          </td>
                          <td className="p-4 font-medium">{item.quantity}</td>
                          <td className="p-4 text-slate-600 dark:text-slate-400">₹{item.rate}</td>
                          <td className="p-4 text-right font-bold text-slate-800 dark:text-slate-200">₹{item.lineTotal.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-slate-50/50 dark:bg-dark-bg/30 p-5 rounded-xl border border-slate-100 dark:border-dark-border flex flex-col items-end space-y-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 flex justify-between w-48"><span>Subtotal:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">₹{selectedOrder.totalAmount.toFixed(2)}</span></p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 flex justify-between w-48 border-b border-slate-200 dark:border-dark-border pb-2"><span>GST:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">₹{selectedOrder.gstAmount.toFixed(2)}</span></p>
                <p className="text-lg font-black text-primary-600 dark:text-primary-400 flex justify-between w-48 pt-1"><span>Total:</span> <span>₹{selectedOrder.grandTotal.toFixed(2)}</span></p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 px-6 py-4 mt-auto border-t border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/20 shrink-0">
              <button onClick={() => setSelectedOrder(null)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg shadow-sm transition-all">
                Close
              </button>
              <button onClick={() => handleRepeatOrder(selectedOrder)} className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-500 rounded-lg shadow-sm shadow-primary-500/30 transition-all flex items-center">
                <RefreshCw size={16} className="mr-2" /> Repeat Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerOrders;
