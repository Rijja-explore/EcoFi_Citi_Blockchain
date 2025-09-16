import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 3000, details = null }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 mr-2 text-white" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 mr-2 text-white" />;
      default:
        return <Info className="w-5 h-5 mr-2 text-white" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-eco-green to-teal-500';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-pink-500';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      default:
        return 'bg-gradient-to-r from-eco-blue to-eco-indigo';
    }
  };

  return (
    <div className={`fixed top-4 right-4 ${getBgColor()} text-white px-4 py-3 rounded-lg shadow-xl z-50 flex items-center animate-fade-in backdrop-blur-sm`}>
      {getIcon()}
      <div className="flex-1">
        <p className="font-montserrat font-semibold">{message}</p>
        {details && <p className="text-xs font-inter mt-1 opacity-80">{details}</p>}
      </div>
      <button 
        onClick={onClose}
        className="ml-4 text-white hover:text-white/70 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;