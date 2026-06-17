import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import { loginApi } from '../Action/api';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error('Please enter both email and password');
    }

    setLoading(true);
    try {
      const response = await loginApi({ email, password });
      if (response.data.success) {
        dispatch(setCredentials(response.data.data));
        toast.success('Logged in successfully');
        
        if (response.data.data.user.role === 'BUYER') {
          navigate('/buyer/dashboard');
        } else {
          navigate('/admin/dashboard');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
        <div className="relative">
          <input 
            type={showPassword ? "text" : "password"} 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field pr-10"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input type="checkbox" className="h-4 w-4 text-primary-600 border-slate-300 rounded" />
          <label className="ml-2 block text-sm text-slate-700 dark:text-slate-300">Remember me</label>
        </div>
        <div className="text-sm">
          <a href="#" className="font-medium text-primary-600 hover:text-primary-500">Forgot password?</a>
        </div>
      </div>

      <button type="submit" disabled={loading} className="w-full btn-primary h-11">
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
};

export default Login;
