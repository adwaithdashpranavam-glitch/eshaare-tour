import React from "react";
import Modal from "./Modal";
import { AlertTriangle } from "lucide-react";

export const ConfirmDialog = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  message, 
  title = "Confirm Action",
  variant = "warning"
}) => {
  const buttonStyles = {
    danger: "bg-danger hover:bg-danger/80 text-white shadow-[0_0_10px_rgba(226,75,74,0.2)]",
    warning: "bg-warning hover:bg-warning/80 text-white shadow-[0_0_10px_rgba(186,117,23,0.2)]",
    info: "bg-info hover:bg-info/80 text-white shadow-[0_0_10px_rgba(55,140,221,0.2)]"
  };

  const actionButtonClass = buttonStyles[variant] || buttonStyles.warning;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className={`p-3 rounded-full bg-white/5 border ${
          variant === 'danger' ? 'text-danger border-danger/20' : 'text-warning border-warning/20'
        }`}>
          <AlertTriangle className="h-6 w-6" />
        </div>
        <p className="text-sm text-on-primary-container/80 font-sans leading-relaxed">
          {message}
        </p>
        <div className="flex w-full space-x-3 pt-4">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-on-primary-fixed-variant border border-on-primary-fixed-variant hover:bg-on-primary-fixed-variant text-on-primary-container font-semibold text-sm rounded-button transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 font-semibold text-sm rounded-button transition-colors ${actionButtonClass}`}
          >
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
