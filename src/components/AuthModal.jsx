import React, { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode);

  // Reset mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const switchToLogin = () => setMode('login');
  const switchToRegister = () => setMode('register');

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm transition-all duration-300"
      onClick={handleBackdropClick}
    >
      <div 
        className={`transform transition-all duration-500 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Form content */}
          <div className="transition-all duration-300">
            {mode === 'login' ? (
              <Login 
                onSwitchToRegister={switchToRegister} 
                onClose={onClose}
              />
            ) : (
              <Register 
                onSwitchToLogin={switchToLogin} 
                onClose={onClose}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal; 