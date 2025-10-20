import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  className = '',
  action,
  footer,
  variant = 'default',
}) => {
  const variantClasses = {
    default: 'pro-card bg-white border border-neutral-200',
    elevated: 'pro-card bg-white border border-neutral-200 shadow-lg',
    outlined: 'pro-card bg-white border-2 border-neutral-300',
  };

  return (
    <div className={`${variantClasses[variant]} ${className}`}>
      {(title || action) && (
        <div className="pro-card-header flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-semibold text-black">{title}</h3>}
            {subtitle && <p className="text-sm text-neutral-600 mt-1">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="pro-card-body">{children}</div>
      {footer && (
        <div className="pro-card-footer">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
