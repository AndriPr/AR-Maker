"use client";

import { useEffect, useRef, useState } from 'react';

// MindAR Viewer Component
export default function MindARViewer({ 
  mindFileUrl = "https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.2/example/image-tracking/assets/card-example/card.mind", 
  elements = [] 
}: { 
  mindFileUrl?: string, 
  elements?: any[] 
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // A-Frame and MindAR must be loaded on the client side
    const loadScripts = async () => {
      if ((window as any).AFRAME) {
        setIsLoaded(true);
        return;
      }

      // Load A-Frame
      const aframeScript = document.createElement('script');
      aframeScript.src = "https://aframe.io/releases/1.4.2/aframe.min.js";
      aframeScript.async = true;
      document.head.appendChild(aframeScript);

      await new Promise((resolve) => {
        aframeScript.onload = resolve;
      });

      // Load MindAR for A-Frame
      const mindarScript = document.createElement('script');
      mindarScript.src = "https://cdn.jsdelivr.net/npm/mind-ar@1.2.2/dist/mindar-image-aframe.prod.js";
      mindarScript.async = true;
      document.head.appendChild(mindarScript);

      await new Promise((resolve) => {
        mindarScript.onload = resolve;
      });

      setIsLoaded(true);
    };

    loadScripts();

    return () => {
      // Cleanup if needed
    };
  }, []);

  if (!isLoaded) {
    return <div className="text-white text-center p-10 font-bold animate-pulse">Initializing AR Engine...</div>;
  }

  // Generate A-Frame HTML string from elements
  const assetItems = elements
    .filter(el => el.type === '3d_model' && el.url)
    .map(el => `<a-asset-item id="asset-${el.id}" src="${el.url}"></a-asset-item>`)
    .join('\n');

  const entities = elements.map(el => {
    // A-Frame rotations are in degrees, Three.js uses radians.
    // Our editor Zustand store uses radians because of React Three Fiber.
    // We must convert radians to degrees for A-Frame.
    const radToDeg = (rad: number) => (rad * 180) / Math.PI;
    const rotStr = `${radToDeg(el.rotation[0])} ${radToDeg(el.rotation[1])} ${radToDeg(el.rotation[2])}`;
    const posStr = `${el.position[0]} ${el.position[1]} ${el.position[2]}`;
    const scaleStr = `${el.scale[0]} ${el.scale[1]} ${el.scale[2]}`;

    if (el.type === '3d_model') {
      return `<a-gltf-model src="#asset-${el.id}" position="${posStr}" rotation="${rotStr}" scale="${scaleStr}"></a-gltf-model>`;
    }
    
    if (el.type === '3d_text') {
      return `<a-text value="${el.content || 'Text'}" color="${el.color || '#ffffff'}" position="${posStr}" rotation="${rotStr}" scale="${scaleStr}" align="center"></a-text>`;
    }

    return '';
  }).join('\n');

  const aframeHtml = `
    <a-scene 
      mindar-image="imageTargetSrc: ${mindFileUrl}; autoStart: true; uiLoading: no; uiError: no;" 
      color-space="sRGB" 
      renderer="colorManagement: true, physicallyCorrectLights" 
      vr-mode-ui="enabled: false" 
      device-orientation-permission-ui="enabled: false"
    >
      <a-assets>
        ${assetItems}
      </a-assets>

      <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

      <a-entity mindar-image-target="targetIndex: 0">
        ${entities}
      </a-entity>
    </a-scene>
  `;

  return (
    <div ref={containerRef} className="w-full h-full relative" style={{ overflow: 'hidden' }}>
      <div 
        className="w-full h-full"
        dangerouslySetInnerHTML={{ __html: aframeHtml }}
      />
    </div>
  );
}
