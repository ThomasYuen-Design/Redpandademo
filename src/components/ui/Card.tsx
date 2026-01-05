import React from 'react';
import { cn } from './Badge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ className, children, ...props }) => {
  return (
    <div 
      className={cn("bg-white rounded-lg border border-slate-200 shadow-sm", className)} 
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ className, children, ...props }) => {
  return (
    <div 
      className={cn("px-6 py-4 border-b border-slate-100", className)} 
      {...props}
    >
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => {
  return (
    <h3 
      className={cn("text-lg font-semibold text-slate-900", className)} 
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, children, ...props }) => {
  return (
    <p 
      className={cn("text-sm text-slate-500 mt-1", className)} 
      {...props}
    >
      {children}
    </p>
  );
};

export const CardContent: React.FC<CardProps> = ({ className, children, ...props }) => {
  return (
    <div 
      className={cn("p-6", className)} 
      {...props}
    >
      {children}
    </div>
  );
};
