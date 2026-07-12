import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Note: might need a server client if RLS is an issue, but ar_projects should be readable if published. Or we can just use the anon key.

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = await params;
  const id = unwrappedParams.id;

  try {
    const { data: project, error } = await supabase
      .from('ar_projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !project) {
      return new NextResponse('Project not found', { status: 404 });
    }

    const elements = project.scene_data?.elements || [];
    const mindFileUrl = project.mind_file_url || "https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.2/examples/image-tracking/assets/card-example/card.mind";

    const assetItems = elements
      .filter((el: any) => el.type === '3d_model' && el.url)
      .map((el: any) => `<a-asset-item id="asset-${el.id}" src="${el.url}"></a-asset-item>`)
      .join('\n        ');

    const entities = elements.map((el: any) => {
      const radToDeg = (rad: number) => (rad * 180) / Math.PI;
      const rotStr = `${radToDeg(el.rotation[0])} ${radToDeg(el.rotation[1])} ${radToDeg(el.rotation[2])}`;
      const posStr = `${el.position[0]} ${el.position[1]} ${el.position[2]}`;
      const scaleStr = `${el.scale[0]} ${el.scale[1]} ${el.scale[2]}`;

      if (el.type === '3d_model') {
        return `<a-gltf-model id="model-${el.id}" src="#asset-${el.id}" position="${posStr}" rotation="${rotStr}" scale="${scaleStr}"></a-gltf-model>`;
      }
      
      if (el.type === '3d_text') {
        const safeContent = (el.content || 'Text')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
        
        return `<a-text value="${safeContent}" color="${el.color || '#ffffff'}" position="${posStr}" rotation="${rotStr}" scale="${scaleStr}" align="center" side="double" width="5"></a-text>`;
      }

      return '';
    }).join('\n        ');

    // Generate HTML for UI Buttons
    const uiButtons = elements
      .filter((el: any) => el.type === 'ui_button' && el.actionTargetId && el.actionAnimation)
      .map((el: any) => {
        return `<button class="ar-action-btn" onclick="playAnimation('model-${el.actionTargetId}', '${el.actionAnimation}')">${el.buttonText || 'Action'}</button>`;
      }).join('\n        ');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
          <script src="https://aframe.io/releases/1.3.0/aframe.min.js"></script>
          <script src="https://cdn.jsdelivr.net/gh/c-frame/aframe-extras@7.0.0/dist/aframe-extras.min.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/mind-ar@1.2.2/dist/mindar-image-aframe.prod.js"></script>
          <style>
            body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: transparent; }
            #ui-layer {
              position: absolute;
              bottom: 30px;
              left: 0;
              width: 100%;
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
              gap: 10px;
              z-index: 9999;
              pointer-events: none;
            }
            .ar-action-btn {
              pointer-events: auto;
              background: linear-gradient(135deg, #2563eb, #4f46e5);
              color: white;
              border: 2px solid rgba(255,255,255,0.5);
              padding: 12px 24px;
              border-radius: 30px;
              font-family: sans-serif;
              font-weight: bold;
              font-size: 16px;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
              cursor: pointer;
              transition: transform 0.1s;
            }
            .ar-action-btn:active {
              transform: scale(0.95);
            }
          </style>
          <script>
            function playAnimation(modelId, animName) {
              const el = document.getElementById(modelId);
              if (el) {
                el.removeAttribute('animation-mixer');
                // Force a small delay to allow attribute removal to register before adding it back
                setTimeout(() => {
                  el.setAttribute('animation-mixer', 'clip: ' + animName + '; loop: once; clampWhenFinished: true; crossFadeDuration: 0.2');
                }, 10);
              }
            }
          </script>
        </head>
        <body>
          <div id="ui-layer">
            ${uiButtons}
          </div>
          <a-scene 
            mindar-image="imageTargetSrc: ${mindFileUrl}; autoStart: true; uiLoading: yes; uiError: yes; filterMinCF: 0.0001; filterBeta: 0.001; missTolerance: 60;" 
            color-space="sRGB" 
            renderer="colorManagement: true, physicallyCorrectLights, antialias: true" 
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

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        // Optional: to ensure the iframe can use features
        'Permissions-Policy': 'camera=*, gyroscope=*, accelerometer=*, magnetometer=*'
      },
    });
  } catch (err) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
