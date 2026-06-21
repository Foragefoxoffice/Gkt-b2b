import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import { loginApi, verifyOtpApi, forgotPasswordApi, resetPasswordApi } from '../Action/api';
import { Eye, EyeOff, Mail, Lock, ShieldCheck, ArrowLeft, KeyRound, MapPin, Phone, Building } from 'lucide-react';
import Loader from '../Common/Loader';

const Login = () => {
  const [showSplash, setShowSplash] = useState(false);
  const [step, setStep] = useState('login'); // 'login' or 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

      if (response.data.data?.requiresOtp) {
        setUserId(response.data.data.user.id);
        setStep('otp');
        toast.success('OTP sent to your registered email address');
      } else if (response.data.success) {
        dispatch(setCredentials(response.data.data));
        toast.success('Logged in successfully');

        setShowSplash(true);
        setTimeout(() => {
          if (response.data.data.user.role === 'BUYER') {
            navigate('/buyer/dashboard');
          } else {
            navigate('/admin/dashboard');
          }
        }, 2500);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return toast.error('Please enter the OTP');

    setLoading(true);
    try {
      const response = await verifyOtpApi({ userId, otp });
      if (response.data.success) {
        dispatch(setCredentials(response.data.data));
        toast.success('Logged in successfully');
        setShowSplash(true);
        setTimeout(() => {
          navigate('/buyer/dashboard');
        }, 2500);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email address');

    setLoading(true);
    try {
      const response = await forgotPasswordApi({ email });
      if (response.data.success) {
        setUserId(response.data.data.userId);
        setStep('reset-password-otp');
        toast.success(response.data.message || 'OTP sent to your registered email');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) return toast.error('Please enter a valid 6-digit OTP');
    if (!newPassword || !confirmPassword) return toast.error('Please fill in the new password fields');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      const response = await resetPasswordApi({ userId, otp, newPassword });
      if (response.data.success) {
        toast.success('Password reset successfully! Please login with your new password.');
        setStep('login');
        setOtp('');
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      {showSplash && <Loader />}
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-slate-100 dark:border-dark-border p-8 sm:p-10">

        {step === 'login' ? (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2 tracking-tight">Welcome to our B2B Buyer Portal!</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Please enter your details to sign in.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all outline-none"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all outline-none"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500/50 transition-colors"
                  />
                  <label htmlFor="remember" className="ml-2 block text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                    Remember for 30 days
                  </label>
                </div>
                <button type="button" onClick={() => setStep('forgot-password')} className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center h-11"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Sign in'}
              </button>
            </form>
          </>
        ) : step === 'otp' ? (
          <>
            <div className="mb-8 text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2 tracking-tight">Security Verification</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                We've sent a 6-digit OTP to your registered email address for verification.
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 text-center">Enter OTP Code</label>
                <input
                  type="text"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[0.5em] text-2xl py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all outline-none"
                  placeholder="000000"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full mt-6 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center h-11"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Verify OTP & Login'}
              </button>

              <button
                type="button"
                onClick={() => setStep('login')}
                disabled={loading}
                className="w-full mt-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                Back to Login
              </button>
            </form>
          </>
        ) : step === 'forgot-password' ? (
          <>
            <button
              onClick={() => setStep('login')}
              className="absolute top-6 left-6 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="mb-8 text-center mt-4">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2 tracking-tight">Forgot Password</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Enter your email address and we'll send you an OTP to reset your password.
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all outline-none"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full mt-6 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center h-11"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Send Reset OTP'}
              </button>
            </form>
          </>
        ) : step === 'reset-password-otp' ? (
          <>
            <button
              onClick={() => setStep('login')}
              className="absolute top-6 left-6 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="mb-8 text-center mt-4">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2 tracking-tight">Reset Password</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Enter the 6-digit OTP sent to your email and choose a new password.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 text-center">Enter OTP Code</label>
                <input
                  type="text"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[0.5em] text-2xl py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all outline-none"
                  placeholder="000000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all outline-none"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all outline-none"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6 || !newPassword || !confirmPassword}
                className="w-full mt-6 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center h-11"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Reset Password'}
              </button>
            </form>
          </>
        ) : null}
      </div>

      {/* Contact Information for New Buyers */}
      {step === 'login' && (
        <div className="mt-8 border border-primary-100 dark:border-primary-900/30 bg-primary-50/50 dark:bg-primary-900/10 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col items-center text-center mb-4">
            <h3 className="text-primary-800 dark:text-primary-300 font-semibold text-lg mb-1">Don't have an account?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Contact us to register for our wholesale B2B platform.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-2 text-sm text-slate-600 dark:text-slate-300">
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
                <span className="leading-relaxed">
                  2/261-2, Chinthamaniur (p.o)<br />
                  Omalur Via, Mettur tk.<br />
                  Salem - 636 455
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-primary-600 shrink-0" />
                <span className="font-medium">9443248344</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-primary-600 shrink-0" />
                <span>ambigaasilks@gmail.com</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Building className="w-4 h-4 text-primary-600 shrink-0" />
                <span className="font-medium text-xs tracking-wide">GST: 33ADLPB5322Q1ZG</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;
