import React, { useEffect, useState } from 'react';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { XMarkIcon } from './icons/XMarkIcon';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      const exitTimer = setTimeout(() => {
        onClose();
      }, 500); // Allow time for fade-out animation
      return () => clearTimeout(exitTimer);
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(onClose, 500); // Match animation duration
  };

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-green-50' : 'bg-red-50';
  const borderColor = isSuccess ? 'border-green-400' : 'border-red-400';
  const textColor = isSuccess ? 'text-green-800' : 'text-red-800';
  const Icon = isSuccess ? CheckCircleIcon : XCircleIcon;

  return (
    <div
      className={`max-w-sm w-full ${bgColor} border-l-4 ${borderColor} rounded-r-md shadow-lg p-4 flex items-start space-x-3 transition-all duration-500 pointer-events-auto ${exiting ? 'animate-fade-out' : 'animate-fade-in-up'}`}
      role="alert"
    >
      <div className={`flex-shrink-0 ${textColor}`}>
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${textColor}`}>
          {message}
        </p>
      </div>
      <div className="flex-shrink-0">
        <button
          onClick={handleClose}
          className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${isSuccess ? `text-green-500 hover:bg-green-100 focus:ring-offset-green-50 focus:ring-green-600` : `text-red-500 hover:bg-red-100 focus:ring-offset-red-50 focus:ring-red-600`}`}
        >
          <span className="sr-only">Dismiss</span>
          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};