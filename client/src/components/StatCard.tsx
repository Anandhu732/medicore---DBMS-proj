import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'error';
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  trend, 
  className = '',
  variant = 'default'
}) => {
  const variantClasses = {
    default: 'bg-white border-neutral-200',
    accent: 'bg-accent-50 border-accent-200',
    success: 'bg-success-50 border-success-200',
    warning: 'bg-warning-50 border-warning-200',
    error: 'bg-error-50 border-error-200',
  };

  const iconClasses = {
    default: 'bg-neutral-100 text-neutral-600',
    accent: 'bg-accent-100 text-accent-600',
    success: 'bg-success-100 text-success-600',
    warning: 'bg-warning-100 text-warning-600',
    error: 'bg-error-100 text-error-600',
  };

  return (
    <div className={`pro-card group hover:shadow-xl transition-all duration-300 ${variantClasses[variant]} ${className}`}>
      <div className="pro-card-body">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-neutral-600 mb-2">{title}</p>
            <p className="text-3xl font-bold text-black mb-3">{value}</p>
            {trend && (
              <div className="flex items-center">
                <span
                  className={`text-sm font-semibold px-2 py-1 rounded-full ${
                    trend.isPositive 
                      ? 'text-success-700 bg-success-100' 
                      : 'text-error-700 bg-error-100'
                  }`}
                >
                  {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
                </span>
                <span className="text-xs text-neutral-500 ml-2">vs last month</span>
              </div>
            )}
          </div>
          <div className="flex-shrink-0 ml-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${iconClasses[variant]}`}>
              {icon}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
