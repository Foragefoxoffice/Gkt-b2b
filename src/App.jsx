import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

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
import InventoryDashboard from './pages/InventoryDashboard.jsx';
import DispatchManager from './pages/DispatchManager.jsx';
import TransporterManager from './pages/TransporterManager.jsx';

import DesignCatalog from './pages/DesignCatalog.jsx';
import Cart from './pages/Cart.jsx';
import BuyerOrders from './pages/BuyerOrders.jsx';

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

function App() {
  // Restore dark mode
  useEffect(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        <Route element={
          <PrivateRoute roles={['ADMIN', 'SUPER_ADMIN']}>
            <AdminLayout />
          </PrivateRoute>
        }>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/buyers" element={<FirmBuyerManager />} />
          <Route path="/admin/designs" element={<DesignManager />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/inventory" element={<InventoryDashboard />} />
          <Route path="/admin/dispatches" element={<DispatchManager />} />
          <Route path="/admin/transporters" element={<TransporterManager />} />
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
        </Route>

        <Route path="*" element={<div className="flex h-screen items-center justify-center">404 Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;
