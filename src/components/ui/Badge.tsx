import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type BadgeVariant = 'success' | 'warning' | 'error' | 'default' | 'neutral';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variants: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  default: 'bg-slate-50 text-slate-700 border-slate-200',
  neutral: 'bg-gray-50 text-gray-700 border-gray-200',
};

export const Badge: React.FC<BadgeProps> = ({ 
  variant = 'default', 
  className, 
  icon,
  children,
  ...props 
}) => {
  return (
    <span 
      className={cn(
        "flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border",
        variants[variant],
        className
      )}
      {...props}
    >
      {icon && <span className="mr-1.5">{icon}</span>}
      {children}
    </span>
  );
};

// Helper to deduce variant from status string
export const getBadgeVariantFromStatus = (status: string): BadgeVariant => {
  const s = status.toUpperCase();
  if (s.includes('200') || s.includes('SUCCESS') || s.includes('HEALTHY') || s.includes('OK')) return 'success';
  if (s.includes('204') || s.includes('WARNING') || s.includes('DEGRADED')) return 'warning';
  if (s.includes('422') || s.includes('500') || s.includes('ERROR') || s.includes('FAILED')) return 'error';
  return 'default';
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const variant = getBadgeVariantFromStatus(status);
  
  const icons: Record<BadgeVariant, React.ReactNode> = {
    success: <CheckCircle2 size={10} />,
    warning: <AlertCircle size={10} />,
    error: <ShieldAlert size={10} />,
    default: <div className="w-2 h-2 rounded-full bg-slate-400" />,
    neutral: <div className="w-2 h-2 rounded-full bg-gray-400" />
  };

  return (
    <Badge variant={variant} icon={icons[variant]}>
      {status}
    </Badge>
  );
};
