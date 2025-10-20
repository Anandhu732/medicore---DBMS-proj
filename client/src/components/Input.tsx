import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  className = '',
  id,
  variant = 'default',
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const variantClasses = {
    default: 'pro-input',
    filled: 'pro-input bg-neutral-50 border-neutral-200',
    outlined: 'pro-input border-2 border-neutral-300',
  };

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-black mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`
            ${variantClasses[variant]}
            ${icon ? 'pl-12' : ''}
            ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-200' : ''}
            ${className}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-2 text-sm text-error-600 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
