import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';
import { Bell, ShoppingCart, Truck, X, Package } from 'lucide-react';
import React from 'react';
import orderDeliveredSound from '../assets/order_delivered.mp3';
import orderCanceledSound from '../assets/order_canceled.mp3';
import orderPlacedSound from '../assets/order_placed.mp3';
import mainNotificationSound from '../assets/main_notification.wav';

let audioInstances = {};
if (typeof Audio !== 'undefined') {
  audioInstances = {
    DISPATCH_CREATED: new Audio(orderDeliveredSound),
    ORDER_CREATED: new Audio(orderPlacedSound),
    ORDER_CANCELLED: new Audio(orderCanceledSound),
    MAIN: new Audio(mainNotificationSound)
  };
}

export const useSocketNotification = () => {
  const socket = useSocket();

  // Unlock audio on first user interaction to prevent NotAllowedError
  useEffect(() => {
    const unlockAudio = () => {
      Object.values(audioInstances).forEach(audio => {
        if (audio) {
          audio.volume = 0; // Silent playback
          audio.play().then(() => {
            audio.pause();
            audio.currentTime = 0;
          }).catch(() => {});
        }
      });
      
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data) => {
      console.log('Received notification:', data);
      
      if (window.pauseNotifications) {
        if (!window.pendingNotifications) window.pendingNotifications = [];
        window.pendingNotifications.push(data);
        return;
      }
      
      // Play sound based on notification type
      const audioToPlay = audioInstances[data.type] || audioInstances.MAIN;
      if (audioToPlay) {
        audioToPlay.volume = 1;
        audioToPlay.currentTime = 0;
        audioToPlay.play().catch(e => {
          if (e.name === 'NotAllowedError') {
            toast('Please click anywhere on the page to enable notification sounds.', { icon: '🔇', id: 'audio-unlock-toast' });
          }
        });
      }

      // Dispatch event to make it available to the notification UI panel
      const notificationData = {
        ...data,
        id: Date.now() + Math.random(),
        timestamp: new Date()
      };
      window.dispatchEvent(new CustomEvent('newNotification', { detail: notificationData }));
      
      // Trigger window events to update badges and UI
      if (data.type?.startsWith('ORDER_')) {
        window.dispatchEvent(new Event('ordersUpdated'));
      }
      if (data.type?.startsWith('DISPATCH_')) {
        window.dispatchEvent(new Event('dispatchesUpdated'));
        window.dispatchEvent(new Event('ordersUpdated')); // Dispatches affect order status too
      }
      if (data.type?.startsWith('PRODUCT_REQUEST_')) {
        window.dispatchEvent(new Event('productRequestsUpdated'));
      }

      const getIcon = (type) => {
        if (type?.startsWith('ORDER')) return <ShoppingCart className="h-5 w-5 text-white" />;
        if (type?.startsWith('DISPATCH')) return <Truck className="h-5 w-5 text-white" />;
        if (type === 'STOCK_UPDATED') return <Package className="h-5 w-5 text-white" />;
        return <Bell className="h-5 w-5 text-white" />;
      };

      const getGradient = (type) => {
        if (type === 'ORDER_CREATED') return 'from-emerald-400 to-emerald-600 shadow-emerald-500/30';
        if (type === 'ORDER_PROCESSING') return 'from-blue-400 to-blue-600 shadow-blue-500/30';
        if (type === 'ORDER_CANCELLED') return 'from-rose-400 to-rose-600 shadow-rose-500/30';
        if (type?.startsWith('DISPATCH')) return 'from-purple-400 to-purple-600 shadow-purple-500/30';
        if (type === 'STOCK_UPDATED') return 'from-amber-400 to-amber-600 shadow-amber-500/30';
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
    
    // Expose global function to resume notifications
    window.resumeNotifications = () => {
      window.pauseNotifications = false;
      if (window.pendingNotifications) {
        window.pendingNotifications.forEach(data => handleNotification(data));
        window.pendingNotifications = [];
      }
    };
    
    // Listen for raw inventory updates
    const handleInventoryUpdate = () => {
      window.dispatchEvent(new Event('inventoryUpdated'));
    };
    socket.on('inventoryUpdated', handleInventoryUpdate);

    // Listen for raw product requests updates
    const handleProductRequestsUpdate = () => {
      window.dispatchEvent(new Event('productRequestsUpdated'));
    };
    socket.on('productRequestsUpdated', handleProductRequestsUpdate);

    return () => {
      socket.off('notification', handleNotification);
      socket.off('inventoryUpdated', handleInventoryUpdate);
      socket.off('productRequestsUpdated', handleProductRequestsUpdate);
      delete window.resumeNotifications;
    };
  }, [socket]);
};
