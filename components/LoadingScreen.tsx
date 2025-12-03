import React from 'react';

export const LoadingScreen: React.FC = () => {
  const logoUrl = "https://i.ibb.co/yFt5CZpK/AZq2-YHs-P-e-ER3okh-Kgbg-AZq2-YHsej-SMQe-If-Wn-CBQ.png";

  return (
    <div className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center overflow-hidden">
      
      {/* Background Animated Blobs */}
      <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-yellow-600/5 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center">
        
        {/* Animated Rings Container (Aumentado) */}
        <div className="relative w-64 h-64 flex items-center justify-center mb-8">
            
            {/* Outer Rotating Ring */}
            <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-orange-500/20 animate-spin-slow"></div>
            
            {/* Inner Rotating Ring (Reverse) */}
            <div className="absolute inset-6 rounded-full border-b-2 border-l-2 border-yellow-500/30 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '5s' }}></div>
            
            {/* Core Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 to-yellow-500/5 rounded-full blur-xl animate-pulse"></div>

            {/* Logo (Maior e sem animação de flutuação) */}
            <div className="relative w-48 h-48 rounded-full bg-black border border-gray-800 flex items-center justify-center overflow-hidden shadow-2xl">
                <img 
                    src={logoUrl} 
                    alt="Loading..." 
                    className="w-full h-full object-contain p-4"
                />
            </div>
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-yellow-500 bg-clip-text text-transparent tracking-widest animate-pulse">
                GMD chat
            </h1>
            <div className="flex gap-1.5 mt-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
        </div>

      </div>

      {/* Footer / Version */}
      <div className="absolute bottom-8 text-gray-600 text-[10px] font-mono tracking-widest opacity-50">
        CARREGANDO RECURSOS...
      </div>
    </div>
  );
};