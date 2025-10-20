import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: { value: string; label: string }[];
  variant?: 'default' | 'filled' | 'outlined';
  children?: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({
  label,
  error,
  options = [],
  className = '',
  id,
  variant = 'default',
  children,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  const variantClasses = {
    default: 'pro-input',
    filled: 'pro-input bg-muted border-muted',
    outlined: 'pro-input border-2 border-border',
  };

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-semibold text-foreground mb-2"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`
          ${variantClasses[variant]}
          ${error ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''}
          ${className}
        `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${selectId}-error` : undefined}
        {...props}
      >
        {children || options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${selectId}-error`} className="mt-2 text-sm text-destructive font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default Select;
