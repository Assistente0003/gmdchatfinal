import React from 'react';
import { ButtonProps } from '../types';

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  children, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "w-full font-bold rounded-full py-3.5 transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98]";
  
  const variants = {
    primary: "bg-gradient-to-r from-amber-400 to-orange-600 text-black hover:shadow-[0_0_20px_rgba(234,88,12,0.4)] hover:brightness-110",
    outline: "bg-transparent border border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200 hover:bg-white/5",
    ghost: "bg-transparent text-gray-400 hover:text-white"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};