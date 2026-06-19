import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';
import { Bell, ShoppingCart, Truck, X } from 'lucide-react';
import React from 'react';

export const useSocketNotification = () => {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data) => {
      console.log('Received notification:', data);
      
      // Trigger window events to update badges and UI
      if (data.type?.startsWith('ORDER_')) {
        window.dispatchEvent(new Event('ordersUpdated'));
      }
      if (data.type?.startsWith('DISPATCH_')) {
        window.dispatchEvent(new Event('dispatchesUpdated'));
        window.dispatchEvent(new Event('ordersUpdated')); // Dispatches affect order status too
      }

      const getIcon = (type) => {
        if (type?.startsWith('ORDER')) return <ShoppingCart className="h-5 w-5 text-white" />;
        if (type?.startsWith('DISPATCH')) return <Truck className="h-5 w-5 text-white" />;
        return <Bell className="h-5 w-5 text-white" />;
      };

      const getGradient = (type) => {
        if (type === 'ORDER_CREATED') return 'from-emerald-400 to-emerald-600 shadow-emerald-500/30';
        if (type === 'ORDER_PROCESSING') return 'from-blue-400 to-blue-600 shadow-blue-500/30';
        if (type === 'ORDER_CANCELLED') return 'from-rose-400 to-rose-600 shadow-rose-500/30';
        if (type?.startsWith('DISPATCH')) return 'from-purple-400 to-purple-600 shadow-purple-500/30';
        return 'from-indigo-400 to-indigo-600 shadow-indigo-500/30';
      };

      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-sm w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-2xl rounded-2xl pointer-events-auto flex flex-col overflow-hidden border border-white/40 dark:border-slate-700/50 ring-1 ring-black/5 transform transition-all hover:scale-[1.02]`}
        >
          <div className="flex p-4 items-start">
            <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${getGradient(data.type)} shadow-lg flex items-center justify-center`}>
              {getIcon(data.type)}
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-bold text-slate-800 dark:text-white tracking-tight">
                {data.title || 'Notification'}
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {data.message}
              </p>
            </div>
            <div className="ml-4 flex flex-shrink-0">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="inline-flex rounded-md text-slate-400 hover:text-slate-500 focus:outline-none transition-colors p-1 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          {/* Animated Progress Bar */}
          <div className="h-1 w-full bg-slate-100 dark:bg-slate-700/50">
            <div 
              className={`h-full bg-gradient-to-r ${getGradient(data.type).replace(/shadow-.*/, '')}`}
              style={{
                animation: t.visible ? 'toast-progress 5s linear forwards' : 'none'
              }}
            />
          </div>
        </div>
      ), { duration: 5000, position: 'top-right' });
    };

    socket.on('notification', handleNotification);
    
    // Listen for raw inventory updates
    const handleInventoryUpdate = () => {
      window.dispatchEvent(new Event('inventoryUpdated'));
    };
    socket.on('inventoryUpdated', handleInventoryUpdate);

    return () => {
      socket.off('notification', handleNotification);
      socket.off('inventoryUpdated', handleInventoryUpdate);
    };
  }, [socket]);
};
