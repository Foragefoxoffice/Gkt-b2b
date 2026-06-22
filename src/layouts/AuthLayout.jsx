import React from 'react';
import { Outlet } from 'react-router-dom';
import logo from "../assets/AmbigaaSilks_logo.png";
import smtLogo from "../assets/SMT_logo.png";

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex w-full bg-slate-50 dark:bg-dark-bg font-sans overflow-hidden">
      {/* Left Pane - Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 p-8 lg:p-10 xl:p-12 relative overflow-hidden text-white">
        {/* Decorative Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-primary-600/20 blur-3xl mix-blend-screen"></div>
          <div className="absolute bottom-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-secondary-600/10 blur-3xl mix-blend-screen"></div>
        </div>

        {/* Top Content */}
        <div className="relative z-10">
          <div className="flex flex-col mb-0">
            <div className="flex items-center gap-6">
              <img style={{ filter: "drop-shadow(2px 4px 8px rgba(0,0,0,0.5))" }} src={logo} alt="Ambigaa Silks Logo" className="h-24 sm:h-28 w-auto object-contain" />
              <div className="h-16 w-px bg-white/30 rounded-full"></div>
              <img style={{ filter: "drop-shadow(2px 4px 8px rgba(0,0,0,0.5))" }} src={smtLogo} alt="Sri MallakkalTextile Logo" className="h-24 sm:h-28 w-auto object-contain" />
            </div>

            <div className="flex flex-col mt-4">
              <h2 className="text-3xl md:text-3xl font-semibold text-white mb-1">
                Ambigaa Silks <span className="text-primary-300 font-light mx-1">|</span> Sri MallakkalTextile
              </h2>
              <span className="text-md text-primary-100 opacity-90 max-w-md leading-relaxed">
                Premium wholesale manufacturers of handloom pure silk sarees.
              </span>
            </div>
          </div>

          <div className="max-w-xl mt-8">
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight mb-6">
              Streamline your wholesale silk operations.
            </h1>
            <p className="text-primary-100 text-lg leading-relaxed mb-6">
              Access exclusive designs, manage inventory, and track your orders in real-time through our secure B2B platform.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span className="text-primary-50 font-medium">Real-time Inventory Updates</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span className="text-primary-50 font-medium">Exclusive Wholesale Designs</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span className="text-primary-50 font-medium">Seamless Order Management</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Content */}
        <div className="relative z-10 flex flex-col gap-4 mt-7">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full border-2 border-primary-900 bg-primary-200 flex items-center justify-center text-primary-800 font-bold text-xs shadow-md">AS</div>
              <div className="w-10 h-10 rounded-full border-2 border-primary-900 bg-secondary-200 flex items-center justify-center text-secondary-800 font-bold text-xs shadow-md">B2B</div>
              <div className="w-10 h-10 rounded-full border-2 border-primary-900 bg-white flex items-center justify-center text-primary-900 font-bold text-xs shadow-md">+</div>
            </div>
            <div className="text-sm font-medium text-primary-100">
              Trusted by 500+ businesses globally
            </div>
          </div>

          <div className="text-xs text-primary-300 mt-4">
            &copy; {new Date().getFullYear()} Ambigaa Silks. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 p-4 sm:p-8 relative h-screen overflow-y-auto">
        <div className="w-full max-w-xl page-enter-active">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center mb-10">
            <div className="flex items-center justify-center gap-5 mb-6 bg-white dark:bg-dark-bg p-4 sm:px-6 rounded-3xl shadow-sm border border-slate-100 dark:border-dark-border">
              <img src={logo} alt="Ambigaa Silks" className="h-16 w-auto object-contain" />
              <div className="h-12 w-px bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              <img src={smtLogo} alt="Sri MallakkalTextile" className="h-16 w-auto object-contain" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white text-center leading-tight">
              Ambigaa Silks <span className="text-primary-600 font-light mx-1">|</span> Sri MallakkalTextile
            </h2>
          </div>

          <Outlet />

          <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 lg:hidden">
            &copy; {new Date().getFullYear()} Ambigaa Silks. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
