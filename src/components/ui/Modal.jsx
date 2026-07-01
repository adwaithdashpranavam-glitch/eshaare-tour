import React, { useEffect } from "react";
import { X } from "lucide-react";

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = "md" 
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-full m-4"
  };

  const selectedSizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300">
      {/* Click backdrop to close */}
      <div className="absolute inset-0 cursor-default" onClick={onClose}></div>

      {/* Modal Card */}
      <div
        className={`w-full ${selectedSizeClass} relative z-10 bg-white border border-gray-200 ring-1 ring-black/5 shadow-2xl flex flex-col
          /* Mobile: slide up bottom sheet */
          rounded-t-card rounded-b-none sm:rounded-card max-h-[85vh] sm:max-h-[90vh]
          animate-[slideUp_0.2s_ease-out] sm:animate-[scaleIn_0.15s_ease-out]`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-display font-semibold text-slate-900 tracking-wide">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 text-sm text-slate-700 font-sans">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
