import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'centered' | 'fullscreen';
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  variant = 'default',
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Don't prevent scrolling on the background page
      // document.body.style.overflow = 'hidden'; // REMOVED
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      // document.body.style.overflow = 'unset'; // REMOVED
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'w-96',
    md: 'w-[500px]',
    lg: 'w-[700px]',
    xl: 'w-[900px]',
  };

  // Determine position based on variant
  const positionClasses = variant === 'fullscreen'
    ? 'top-0 right-0 bottom-0 w-full max-w-full rounded-none'
    : 'top-4 right-4 bottom-4 rounded-2xl';

  return (
    <>
      {/* Slide-in Panel - Extension Style */}
      <div
        className={`fixed ${positionClasses} ${sizeClasses[size]} bg-white shadow-2xl border border-gray-200 z-50 overflow-hidden transition-all duration-300 ease-out transform ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
        style={{
          backgroundColor: '#ffffff',
          color: '#0f172a',
          maxHeight: variant === 'fullscreen' ? '100vh' : 'calc(100vh - 2rem)',
          pointerEvents: 'auto',
        }}
        aria-labelledby="panel-title"
        role="dialog"
        aria-modal="false"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-white px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <h3 id="panel-title" className="text-lg font-bold text-gray-900">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-2 transition-all"
            aria-label="Close panel"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="bg-white px-6 py-5 overflow-y-auto text-gray-900" style={{ height: footer ? 'calc(100% - 180px)' : 'calc(100% - 64px)' }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 sticky bottom-0">
            {footer}
          </div>
        )}
      </div>

      {/* Optional: Subtle indicator that panel is open (no blocking overlay) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 pointer-events-none transition-opacity duration-300"
          style={{
            background: 'transparent',
            pointerEvents: 'none' // Allow clicks to pass through to the page
          }}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Modal;
