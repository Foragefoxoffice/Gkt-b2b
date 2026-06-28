import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, CheckCircle, XCircle, Info } from 'lucide-react';

/**
 * A beautiful, reusable confirmation dialog component.
 *
 * Props:
 * - open (bool): Whether the dialog is visible
 * - onConfirm (fn): Called when user clicks the confirm button
 * - onCancel (fn): Called when user clicks cancel or backdrop
 * - title (string): Dialog title (default: "Are you sure?")
 * - message (string): Dialog body message
 * - confirmText (string): Confirm button text (default: "Confirm")
 * - cancelText (string): Cancel button text (default: "Cancel")
 * - variant (string): 'danger' | 'warning' | 'success' | 'info' (default: 'danger')
 */

const variantConfig = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
    ringColor: 'ring-red-50 dark:ring-red-900/20',
    confirmBg: 'bg-red-600 hover:bg-red-500 shadow-red-600/30',
    accentGradient: 'from-red-500 to-rose-500',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    ringColor: 'ring-amber-50 dark:ring-amber-900/20',
    confirmBg: 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30',
    accentGradient: 'from-amber-500 to-orange-500',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    ringColor: 'ring-emerald-50 dark:ring-emerald-900/20',
    confirmBg: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30',
    accentGradient: 'from-emerald-500 to-green-500',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    ringColor: 'ring-blue-50 dark:ring-blue-900/20',
    confirmBg: 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30',
    accentGradient: 'from-blue-500 to-indigo-500',
  },
};

const ConfirmDialog = ({
  open,
  onConfirm,
  onCancel,
  title = 'Are you sure?',
  message = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  children,
}) => {
  const config = variantConfig[variant] || variantConfig.danger;
  const IconComponent = config.icon;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed modal_main inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-dark-border"
          >
            {/* Top accent bar */}
            <div className={`h-1 w-full bg-gradient-to-r ${config.accentGradient}`} />

            <div className="p-6 pt-5">
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className={`w-14 h-14 rounded-full ${config.iconBg} ${config.ringColor} ring-8 flex items-center justify-center`}>
                  <IconComponent size={26} className={config.iconColor} />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-slate-800 dark:text-white text-center mb-2">
                {title}
              </h3>

              {/* Message */}
              {message && (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center leading-relaxed max-w-sm mx-auto">
                  {message}
                </p>
              )}

              {/* Children (e.g., input fields) */}
              {children && (
                <div className="mt-5 max-w-sm mx-auto">
                  {children}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 px-6 py-4 bg-slate-50/80 dark:bg-dark-bg/50 border-t border-slate-100 dark:border-dark-border">
              <button
                onClick={onCancel}
                className="flex-1 px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-bg hover:border-slate-300 rounded-xl shadow-sm transition-all active:scale-[0.98]"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 px-5 py-2.5 text-sm font-medium text-white ${config.confirmBg} rounded-xl shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
