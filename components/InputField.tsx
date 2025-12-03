import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { InputProps } from '../types';

export const InputField: React.FC<InputProps> = ({ 
  label, 
  icon, 
  isPassword, 
  type = 'text', 
  className = '', 
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`mb-5 ${className}`}>
      <label className="block text-gray-400 text-sm font-medium mb-2 pl-1">
        {label}
      </label>
      <div className="relative group">
        {/* Left Icon */}
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-yellow-500 transition-colors">
          {icon}
        </div>

        <input
          type={inputType}
          // Changed text-sm to text-base (16px) to prevent iOS zoom
          className="w-full bg-[#121212] border border-[#2a2a2a] text-gray-200 text-base rounded-xl block pl-11 pr-10 py-3.5 placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all duration-200"
          {...props}
        />

        {/* Password Toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
    </div>
  );
};