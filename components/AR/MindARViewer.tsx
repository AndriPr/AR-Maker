"use client";

// MindAR Viewer Component isolated in an iframe to prevent React Strict Mode / Hydration conflicts
export default function MindARViewer({ 
  mindFileUrl = "https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.2/example/image-tracking/assets/card-example/card.mind", 
  elements = [] 
}: { 
  mindFileUrl?: string, 
  elements?: any[] 
}) {

  // Generate A-Frame HTML string from elements
  const assetItems = elements
    .filter(el => el.type === '3d_model' && el.url)
    .map(el => `<a-asset-item id="asset-${el.id}" src="${el.url}"></a-asset-item>`)
    .join('\n        ');

  const entities = elements.map(el => {
    // Convert radians to degrees for A-Frame
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
  }).join('\n        ');

  const htmlContent = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <script src="https://aframe.io/releases/1.3.0/aframe.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/mind-ar@1.2.2/dist/mindar-image-aframe.prod.js"></script>
        <style>
          body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: #000; }
        </style>
      </head>
      <body>
        <a-scene 
          mindar-image="imageTargetSrc: ${mindFileUrl}; autoStart: true; uiLoading: yes; uiError: yes;" 
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
      </body>
    </html>
  `;

  return (
    <div className="w-full h-full bg-black">
      <iframe 
        srcDoc={htmlContent} 
        allow="camera; accelerometer; magnetometer; gyroscope; display-capture; xr-spatial-tracking"
        className="w-full h-full border-none"
        title="AR Viewer"
      />
    </div>
  );
}
