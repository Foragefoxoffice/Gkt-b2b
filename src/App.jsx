import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser } from './store/slices/authSlice';
import { getProfileApi } from './Action/api';

// Layouts
import AuthLayout from './layouts/AuthLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import BuyerLayout from './layouts/BuyerLayout.jsx';

// Pages
import Login from './pages/Login.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import BuyerDashboard from './pages/BuyerDashboard.jsx';

import FirmBuyerManager from './pages/FirmBuyerManager.jsx';
import DesignManager from './pages/DesignManager.jsx';
import AdminOrders from './pages/AdminOrders.jsx';
import AdminRequests from './pages/AdminRequests.jsx';
import InventoryDashboard from './pages/InventoryDashboard.jsx';
import DispatchManager from './pages/DispatchManager.jsx';
import TransporterManager from './pages/TransporterManager.jsx';
import Company from './pages/Company.jsx';
import AdminSettings from './pages/AdminSettings.jsx';
import StaffManager from './pages/StaffManager.jsx';

import DesignCatalog from './pages/DesignCatalog.jsx';
import Cart from './pages/Cart.jsx';
import BuyerOrders from './pages/BuyerOrders.jsx';
import Products from './pages/Products.jsx';
import ProductDetails from './pages/ProductDetails.jsx';

const PrivateRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useSelector(state => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

import { SocketProvider } from './context/SocketContext.jsx';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth);

  // Restore dark mode
  useEffect(() => {
    if (isAuthenticated) {
      getProfileApi()
        .then(res => {
          if (res.data?.success) {
            dispatch(updateUser(res.data.data));
          }
        })
        .catch(err => {
          console.error("Failed to fetch profile", err);
        });
    }

    if (localStorage.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
          </Route>

          <Route element={
            <PrivateRoute roles={['ADMIN', 'SUPER_ADMIN', 'STAFF', 'MANAGER', 'DISPATCHER']}>
              <AdminLayout />
            </PrivateRoute>
          }>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/buyers" element={<PrivateRoute roles={['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'STAFF']}><FirmBuyerManager /></PrivateRoute>} />
            <Route path="/admin/companies" element={<PrivateRoute roles={['ADMIN', 'SUPER_ADMIN', 'MANAGER']}><Company /></PrivateRoute>} />
            <Route path="/admin/designs" element={<PrivateRoute roles={['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'STAFF']}><DesignManager /></PrivateRoute>} />
            <Route path="/admin/orders" element={<PrivateRoute roles={['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'STAFF', 'DISPATCHER']}><AdminOrders /></PrivateRoute>} />
            <Route path="/admin/requests" element={<PrivateRoute roles={['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'STAFF']}><AdminRequests /></PrivateRoute>} />
            <Route path="/admin/inventory" element={<PrivateRoute roles={['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'STAFF']}><InventoryDashboard /></PrivateRoute>} />
            <Route path="/admin/dispatches" element={<PrivateRoute roles={['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'DISPATCHER']}><DispatchManager /></PrivateRoute>} />
            <Route path="/admin/transporters" element={<PrivateRoute roles={['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'DISPATCHER']}><TransporterManager /></PrivateRoute>} />
            <Route path="/admin/staff" element={<PrivateRoute roles={['ADMIN', 'SUPER_ADMIN']}><StaffManager /></PrivateRoute>} />
            <Route path="/admin/settings" element={<PrivateRoute roles={['ADMIN', 'SUPER_ADMIN']}><AdminSettings /></PrivateRoute>} />
          </Route>

          <Route element={
            <PrivateRoute roles={['BUYER']}>
              <BuyerLayout />
            </PrivateRoute>
          }>
            <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
            <Route path="/buyer/designs" element={<DesignCatalog />} />
            <Route path="/buyer/cart" element={<Cart />} />
            <Route path="/buyer/orders" element={<BuyerOrders />} />
            <Route path="/buyer/products" element={<Products />} />
            <Route path="/buyer/product/:id" element={<ProductDetails />} />
            <Route path="/buyer/settings" element={<AdminSettings />} />
          </Route>

          <Route path="/unauthorized" element={
            <div className="flex h-screen items-center justify-center flex-col gap-4 text-slate-800 dark:text-white">
              <h1 className="text-4xl font-bold">403</h1>
              <p className="text-lg">You are not authorized to view this page.</p>
              <button 
                onClick={() => { localStorage.clear(); window.location.href = '/login'; }} 
                className="mt-4 px-4 py-2 bg-[#e2148d] text-white rounded-lg hover:bg-[#c11078]"
              >
                Return to Login
              </button>
            </div>
          } />
          <Route path="*" element={<div className="flex h-screen items-center justify-center text-slate-800 dark:text-white">404 Not Found</div>} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;
