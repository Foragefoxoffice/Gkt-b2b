import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Mail, Lock, Building, Server } from 'lucide-react';
import logo from "../assets/AmbigaaSilks_logo.png";
import smtLogo from "../assets/SMT_logo.png";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-slate-200 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header with Logos */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center gap-5 mb-6 bg-white dark:bg-dark-card p-4 sm:px-6 rounded-3xl shadow-sm border border-slate-100 dark:border-dark-border">
            <img src={logo} alt="Ambigaa Silks" className="h-14 sm:h-16 w-auto object-contain" />
            <div className="h-10 w-px bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            <img src={smtLogo} alt="Sri MallakkalTextile" className="h-14 sm:h-16 w-auto object-contain" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white text-center leading-tight mb-2">
            Ambigaa Silks <span className="text-primary-600 font-light mx-1">|</span> Sri MallakkalTextile
          </h2>
        </div>

        {/* Main Content Card */}
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-slate-100 dark:border-dark-border overflow-hidden">
          
          {/* Card Header */}
          <div className="border-b border-slate-100 dark:border-dark-border p-6 sm:p-8 flex items-center justify-between bg-primary-50/50 dark:bg-primary-900/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">Privacy Policy</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">How we protect and use your information</p>
              </div>
            </div>
            <button 
              onClick={() => navigate(-1)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-primary-600 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:text-primary-400 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>

          {/* Content Sections */}
          <div className="p-6 sm:p-10 space-y-10 text-slate-600 dark:text-slate-300 leading-relaxed">
            
            <section className="relative">
              <div className="absolute -left-10 top-1 bottom-1 w-1 bg-primary-500 rounded-r hidden sm:block"></div>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                1. Introduction
              </h2>
              <p>
                Welcome to our B2B application. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice or our practices with regard to your personal information, please contact us.
              </p>
            </section>

            <section className="relative">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                2. Information We Collect
              </h2>
              <p className="mb-4">We collect personal information that you voluntarily provide to us when you register on the application, express an interest in obtaining information about us or our products and services, or otherwise contact us. The personal information we collect may include:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0"></div>
                  <span className="text-sm">Names, phone numbers, email addresses, and contact preferences.</span>
                </div>
                <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0"></div>
                  <span className="text-sm">Business details, GST numbers, company addresses.</span>
                </div>
                <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0"></div>
                  <span className="text-sm">Financial information required for processing payments.</span>
                </div>
                <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0"></div>
                  <span className="text-sm">Log and usage data, device data, and location data.</span>
                </div>
              </div>
            </section>

            <section className="relative">
               <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                  <Server className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                3. How We Use Your Information
              </h2>
              <p className="mb-4">We use personal information collected via our application for a variety of business purposes described below.</p>
              <ul className="space-y-2 mt-2">
                <li className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="w-4 h-4 text-primary-500 shrink-0" />
                  To facilitate account creation and logon process.
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="w-4 h-4 text-primary-500 shrink-0" />
                  To manage user accounts and provide customer support.
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="w-4 h-4 text-primary-500 shrink-0" />
                  To fulfill and manage your orders, payments, returns, and exchanges.
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="w-4 h-4 text-primary-500 shrink-0" />
                  To send administrative information and policy updates.
                </li>
              </ul>
            </section>

            <section className="relative">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                  <Building className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                4. Sharing Your Information
              </h2>
              <p>
                We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We may process or share your data that we hold based on the following legal basis:
              </p>
              <div className="mt-4 space-y-4">
                <div className="bg-primary-50/30 dark:bg-primary-900/10 border-l-4 border-primary-500 p-4 rounded-r-lg text-sm">
                  <strong className="text-primary-800 dark:text-primary-300 block mb-1">Consent</strong>
                  We may process your data if you have given us specific consent to use your personal information for a specific purpose.
                </div>
                <div className="bg-primary-50/30 dark:bg-primary-900/10 border-l-4 border-primary-500 p-4 rounded-r-lg text-sm">
                  <strong className="text-primary-800 dark:text-primary-300 block mb-1">Legitimate Interests</strong>
                  We may process your data when it is reasonably necessary to achieve our legitimate business interests.
                </div>
                <div className="bg-primary-50/30 dark:bg-primary-900/10 border-l-4 border-primary-500 p-4 rounded-r-lg text-sm">
                  <strong className="text-primary-800 dark:text-primary-300 block mb-1">Performance of a Contract</strong>
                  Where we have entered into a contract with you, we may process your personal information to fulfill the terms.
                </div>
              </div>
            </section>

            <section className="relative">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                5. Data Security
              </h2>
              <p>
                We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
              </p>
            </section>
            
          </div>

          {/* Card Footer */}
          <div className="border-t border-slate-100 dark:border-dark-border p-6 bg-slate-50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center justify-between gap-4">
             <button 
              onClick={() => navigate(-1)}
              className="sm:hidden w-full flex justify-center items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
            <div className="text-sm text-slate-500 dark:text-slate-400 text-center sm:text-left w-full">
              Last updated: <span className="font-medium text-slate-700 dark:text-slate-300">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          &copy; {new Date().getFullYear()} Ambigaa Silks. All rights reserved.
        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicy;
