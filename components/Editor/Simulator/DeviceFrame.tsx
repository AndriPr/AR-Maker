import React from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface DeviceFrameProps {
  deviceType: DeviceType;
  children: React.ReactNode;
}

export function DeviceFrame({ deviceType, children }: DeviceFrameProps) {
  if (deviceType === 'desktop') {
    return <div className="w-full h-full relative">{children}</div>;
  }

  const isMobile = deviceType === 'mobile';
  
  // Dimensions based on typical devices
  // Mobile: 390x844 (iPhone 14)
  // Tablet: 1024x768 (iPad) - rendered landscape
  const width = isMobile ? '390px' : '1024px';
  const height = isMobile ? '844px' : '768px';
  const borderRadius = isMobile ? '40px' : '24px';
  const borderWidth = isMobile ? '12px' : '16px';
  
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#0a0a0c] overflow-hidden p-8">
      {/* Device Bezel */}
      <div 
        className="relative bg-black shadow-2xl shrink-0 ring-1 ring-gray-800 transition-all duration-500 ease-in-out"
        style={{
          width,
          height,
          borderRadius,
          border: `${borderWidth} solid #1a1b1e`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px #333'
        }}
      >
        {/* Notch / Camera / Sensors */}
        {isMobile && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[25px] bg-[#1a1b1e] z-[100] rounded-b-3xl flex justify-center items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-900/50"></div>
             <div className="w-12 h-1.5 rounded-full bg-gray-900 border border-gray-800"></div>
          </div>
        )}
        
        {!isMobile && (
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[16px] h-[80px] bg-[#1a1b1e] -ml-[16px] z-50 flex items-center justify-center rounded-l-xl">
             <div className="w-1.5 h-1.5 rounded-full bg-gray-900 border border-gray-800 ml-1"></div>
          </div>
        )}

        {/* Screen Area */}
        <div className="w-full h-full bg-black relative overflow-hidden" style={{ borderRadius: isMobile ? '28px' : '8px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
