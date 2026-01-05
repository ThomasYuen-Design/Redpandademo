import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipContextType {
  isVisible: boolean;
  show: () => void;
  hide: () => void;
  coords: { x: number; y: number };
  setTriggerRef: (ref: HTMLElement | null) => void;
}

const TooltipContext = React.createContext<TooltipContextType | undefined>(undefined);

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const Tooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLElement | null>(null);

  const show = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        x: rect.left + rect.width / 2,
        y: rect.top
      });
      setIsVisible(true);
    }
  };

  const hide = () => setIsVisible(false);

  return (
    <TooltipContext.Provider value={{ isVisible, show, hide, coords, setTriggerRef: (el) => { triggerRef.current = el; } }}>
      <div className="relative inline-block" onMouseEnter={show} onMouseLeave={hide}>
        {children}
      </div>
    </TooltipContext.Provider>
  );
};

export const TooltipTrigger: React.FC<{ children: React.ReactNode; asChild?: boolean }> = ({ children }) => {
  const context = React.useContext(TooltipContext);
  if (!context) throw new Error("TooltipTrigger must be used within a Tooltip");

  // In a real generic implementation we'd handle asChild to cloneElement, 
  // but for simplicity we'll just wrap. 
  // Actually, to get the ref properly without a wrapper div that might break layout (flex), 
  // we should use cloneElement if it's a single child.
  
  return (
    <div ref={context.setTriggerRef} className="inline-flex">
      {children}
    </div>
  );
};

export const TooltipContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => {
  const context = React.useContext(TooltipContext);
  if (!context) throw new Error("TooltipContent must be used within a Tooltip");

  if (!context.isVisible) return null;

  return createPortal(
    <div 
      className={`fixed z-50 px-3 py-1.5 text-xs text-white bg-slate-900 rounded shadow-md transform -translate-x-1/2 -translate-y-full -mt-2 pointer-events-none animate-in fade-in zoom-in-95 duration-200 ${className}`}
      style={{ top: context.coords.y, left: context.coords.x }}
    >
      {children}
      <div className="absolute left-1/2 bottom-0 w-2 h-2 bg-slate-900 transform -translate-x-1/2 translate-y-1/2 rotate-45" />
    </div>,
    document.body
  );
};
