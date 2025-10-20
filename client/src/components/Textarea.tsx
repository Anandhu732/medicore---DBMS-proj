import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  variant?: 'default' | 'filled' | 'outlined';
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  className = '',
  id,
  variant = 'default',
  ...props
}) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  const variantClasses = {
    default: 'pro-input',
    filled: 'pro-input bg-muted border-muted',
    outlined: 'pro-input border-2 border-border',
  };

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-semibold text-foreground mb-2"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`
          ${variantClasses[variant]}
          resize-vertical
          ${error ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''}
          ${className}
        `}
        rows={4}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${textareaId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${textareaId}-error`} className="mt-2 text-sm text-destructive font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default Textarea;
