import React from 'react';
import logo from '../assets/AmbigaaSilks_logo.png';

export default function Loader() {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-50 dark:bg-dark-bg">
            <img
                src={logo}
                alt="Ambigaa Silks Logo"
                className="h-32 w-auto mb-5 animate-pulse"
            />
            <div className="flex space-x-3">
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
        </div>
    );
}