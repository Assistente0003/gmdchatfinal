
import React, { useState } from 'react';

export const Logo: React.FC = () => {
  const [imageError, setImageError] = useState(false);
  
  // URL direta da imagem fornecida pelo usuário
  const logoUrl = "https://i.ibb.co/yFt5CZpK/AZq2-YHs-P-e-ER3okh-Kgbg-AZq2-YHsej-SMQe-If-Wn-CBQ.png"; 

  return (
    <div className="flex justify-center mb-6 sm:mb-8">
      <div className="relative w-24 h-24 sm:w-40 sm:h-40 rounded-full border-2 border-yellow-500/30 flex items-center justify-center bg-black/40 shadow-[0_0_30px_rgba(234,179,8,0.15)] transition-all duration-300 overflow-hidden">
        {/* Inner ring */}
        <div className="absolute inset-1 rounded-full border border-yellow-500/10 pointer-events-none z-10"></div>
        
        {!imageError ? (
          <img 
            src={logoUrl} 
            alt="GMD Logo" 
            className="w-full h-full object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <h1 className="text-2xl sm:text-5xl font-bold tracking-widest bg-gradient-to-b from-yellow-300 via-yellow-500 to-orange-600 bg-clip-text text-transparent drop-shadow-sm transition-all duration-300">
            GMD
          </h1>
        )}
      </div>
    </div>
  );
};
