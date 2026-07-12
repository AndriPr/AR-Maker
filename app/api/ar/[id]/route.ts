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
      .filter((el: any) => el.type === 'ui_button')
      .map((el: any) => {
        const targetStr = el.actionTargetId ? `'model-${el.actionTargetId}'` : 'null';
        const animStr = el.actionAnimation ? `'${el.actionAnimation.replace(/'/g, "\\'")}'` : 'null';
        return `<button class="ar-action-btn" onclick="playAnimation(${targetStr}, ${animStr})">${el.buttonText || 'Tombol'}</button>`;
      }).join('\n        ');

    // Generate HTML for Edu Panel (Dashboard)
    const eduPanels = elements.filter((el: any) => el.type === 'edu_panel');
    const eduDashboardHtml = eduPanels.length > 0 ? `
      <div id="edu-dashboard" style="display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 85%; max-width: 400px; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.2); border-radius: 16px; padding: 20px; color: white; font-family: sans-serif; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); z-index: 10000; pointer-events: auto; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; margin-bottom: 16px;">
          <h2 style="margin: 0; font-size: 18px; font-weight: 800; letter-spacing: 1px; color: #fbbf24; text-transform: uppercase;">${eduPanels[0].panelTitle || 'DASHBOARD EDUKASI'}</h2>
          <div style="background: rgba(34, 197, 94, 0.2); color: #4ade80; padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; border: 1px solid rgba(34, 197, 94, 0.3); white-space: nowrap;">${eduPanels[0].healthStatus || 'N/A'}</div>
        </div>
        
        <div style="margin-bottom: 16px;">
          <h3 style="margin: 0 0 6px 0; font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: bold; letter-spacing: 0.5px;">Informasi Aset</h3>
          <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #e2e8f0;">${eduPanels[0].panelDescription || 'Belum ada deskripsi.'}</p>
        </div>

        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 6px 0; font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: bold; letter-spacing: 0.5px;">User Experience / Catatan</h3>
          <div style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.05); padding: 10px 12px; border-radius: 8px; font-size: 12px; border-left: 3px solid #60a5fa; color: #bfdbfe;">
             ${eduPanels[0].userExperience || '-'}
          </div>
        </div>

        ${(eduPanels[0].actionTargetId && eduPanels[0].actionAnimation) ? `
          <button 
            onclick="playAnimation(${eduPanels[0].actionTargetId ? `'model-${eduPanels[0].actionTargetId}'` : 'null'}, '${eduPanels[0].actionAnimation.replace(/'/g, "\\'")}')"
            style="width: 100%; background: linear-gradient(135deg, #3b82f6, #4f46e5); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 14px; border-radius: 10px; font-weight: bold; font-size: 14px; cursor: pointer; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3); transition: transform 0.1s;"
            onmousedown="this.style.transform='scale(0.97)'"
            onmouseup="this.style.transform='scale(1)'"
            ontouchstart="this.style.transform='scale(0.97)'"
            ontouchend="this.style.transform='scale(1)'"
          >
            🔧 MULAI MAINTENANCE
          </button>
        ` : ''}
      </div>
    ` : '';

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
            document.addEventListener("DOMContentLoaded", function() {
              const target = document.querySelector('[mindar-image-target]');
              const dashboard = document.getElementById('edu-dashboard');
              
              if (target && dashboard) {
                target.addEventListener("targetFound", event => {
                  dashboard.style.display = 'flex';
                  // Adding a tiny animation effect when it appears
                  dashboard.style.animation = 'fadeInUp 0.4s ease-out forwards';
                });
                target.addEventListener("targetLost", event => {
                  dashboard.style.display = 'none';
                });
              }
            });

            function playAnimation(modelId, animName) {
              if (!modelId || !animName) {
                alert("Tombol ini belum dihubungkan ke animasi 3D mana pun.");
                return;
              }
              const el = document.getElementById(modelId);
              if (el) {
                el.removeAttribute('animation-mixer');
                // Menggunakan format objek agar nama animasi yang mengandung karakter titik dua (:) tidak merusak parser A-Frame
                setTimeout(() => {
                  el.setAttribute('animation-mixer', {
                    clip: animName,
                    loop: 'once',
                    clampWhenFinished: true,
                    crossFadeDuration: 0.2
                  });
                }, 10);
              }
            }
          </script>
          <style>
            @keyframes fadeInUp {
              from { opacity: 0; transform: translate(-50%, -45%); }
              to { opacity: 1; transform: translate(-50%, -50%); }
            }
          </style>
        </head>
        <body>
          <div id="ui-layer">
            ${uiButtons}
          </div>
          ${eduDashboardHtml}
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
