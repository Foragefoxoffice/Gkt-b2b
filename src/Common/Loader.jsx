import React from 'react';
import logo1 from '../assets/AmbigaaSilks_logo.png';
import logo2 from '../assets/SMT_logo.png';

export default function Loader() {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-50 dark:bg-dark-bg">
            <div className="logo-flip-container h-32 w-48 mb-5">
                <div className="logo-flip-wrapper">
                    <img
                        src={logo1}
                        alt="Ambigaa Silks Logo"
                        className="logo-flip-front"
                    />
                    <img
                        src={logo2}
                        alt="SMT Logo"
                        className="logo-flip-back"
                    />
                </div>
            </div>
            <div className="flex space-x-3">
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
        </div>
    );
}