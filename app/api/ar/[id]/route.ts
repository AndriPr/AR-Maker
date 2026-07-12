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
    const hasEduPanel = eduPanels.length > 0;
    const panelTitle = hasEduPanel ? eduPanels[0].panelTitle || 'DASHBOARD' : '';
    const eduComponents = hasEduPanel ? (eduPanels[0].eduComponents || []) : [];
    const eduTasks = hasEduPanel ? (eduPanels[0].eduMaintenanceTasks || []) : [];

    const eduDashboardHtml = hasEduPanel ? `
      <div id="edu-dashboard" style="display: none; position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); width: 85%; max-width: 380px; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.15); border-radius: 24px; padding: 15px 20px 20px 20px; color: white; font-family: sans-serif; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7); z-index: 10000; pointer-events: auto; flex-direction: column; overflow: hidden; max-height: 45vh; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);">
        
        <!-- DRAG HANDLE / TOGGLE -->
        <div onclick="toggleEduPanel()" style="width: 100%; display: flex; justify-content: center; align-items: center; padding-bottom: 15px; cursor: pointer;">
          <div style="width: 36px; height: 5px; background: rgba(255,255,255,0.4); border-radius: 10px;"></div>
        </div>

        <!-- HEADER -->
        <div id="edu-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; margin-bottom: 12px;">
          <h2 id="edu-title" style="margin: 0; font-size: 16px; font-weight: 800; letter-spacing: 1px; color: #fbbf24; text-transform: uppercase; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${panelTitle}</h2>
          <button id="edu-back-btn" style="display: none; background: rgba(255,255,255,0.15); border: none; color: white; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: bold; cursor: pointer; transition: background 0.2s;">&lt; KEMBALI</button>
        </div>
        
        <!-- CONTENT AREA -->
        <div id="edu-content" style="overflow-y: auto; flex: 1; padding-right: 4px; display: block; transition: opacity 0.2s;">
          <!-- MAIN MENU -->
          <div id="edu-view-main" style="display: flex; flex-direction: column; gap: 10px;">
            <button onclick="eduNav('components')" style="width: 100%; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border: none; padding: 14px; border-radius: 12px; font-weight: bold; font-size: 13px; text-align: left; cursor: pointer; display: flex; justify-content: space-between; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              <span>🗂️ Asset Info (Komponen)</span>
              <span>&gt;</span>
            </button>
            <button onclick="eduNav('maintenance')" style="width: 100%; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; padding: 14px; border-radius: 12px; font-weight: bold; font-size: 13px; text-align: left; cursor: pointer; display: flex; justify-content: space-between; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              <span>🔧 Tugas Maintenance</span>
              <span>&gt;</span>
            </button>
          </div>

          <!-- COMPONENTS LIST -->
          <div id="edu-view-components" style="display: none; flex-direction: column; gap: 8px;"></div>

          <!-- MAINTENANCE LIST -->
          <div id="edu-view-maintenance" style="display: none; flex-direction: column; gap: 8px;"></div>

          <!-- STEP BY STEP VIEW -->
          <div id="edu-view-step" style="display: none; flex-direction: column; gap: 14px;">
            <div style="background: rgba(255,255,255,0.05); border-left: 4px solid #60a5fa; padding: 14px; border-radius: 8px;">
              <h3 id="edu-step-title" style="margin: 0 0 6px 0; font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: bold; letter-spacing: 0.5px;">LANGKAH 1 DARI X</h3>
              <p id="edu-step-instruction" style="margin: 0; font-size: 13px; line-height: 1.5; color: #e2e8f0; font-weight: 500;">...</p>
            </div>
            
            <button id="edu-step-next" onclick="eduNextStep()" style="width: 100%; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 12px; border-radius: 12px; font-weight: bold; font-size: 13px; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); transition: transform 0.1s;" onmousedown="this.style.transform='scale(0.98)'" onmouseup="this.style.transform='scale(1)'">
              Langkah Selanjutnya ➔
            </button>
          </div>
        </div>
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
            // Edu Panel State
            const eduComponents = ${JSON.stringify(eduComponents)};
            const eduTasks = ${JSON.stringify(eduTasks)};
            let currentView = 'main'; // main, components, maintenance, step
            let currentTask = null;
            let currentStepIdx = 0;
            let isEduCollapsed = false;

            function toggleEduPanel() {
              isEduCollapsed = !isEduCollapsed;
              const content = document.getElementById('edu-content');
              const header = document.getElementById('edu-header');
              if (isEduCollapsed) {
                content.style.display = 'none';
                header.style.marginBottom = '0';
                header.style.paddingBottom = '0';
                header.style.borderBottom = 'none';
              } else {
                content.style.display = 'block';
                header.style.marginBottom = '12px';
                header.style.paddingBottom = '12px';
                header.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
              }
            }

            document.addEventListener("DOMContentLoaded", function() {
              const target = document.querySelector('[mindar-image-target]');
              const dashboard = document.getElementById('edu-dashboard');
              
              if (target && dashboard) {
                target.addEventListener("targetFound", event => {
                  dashboard.style.display = 'flex';
                  dashboard.style.animation = 'fadeInUp 0.4s ease-out forwards';
                });
                target.addEventListener("targetLost", event => {
                  dashboard.style.display = 'none';
                });
              }
            });

            function playAnimation(modelId, animName) {
              if (!modelId || !animName) return;
              const el = document.getElementById(modelId);
              if (el) {
                el.removeAttribute('animation-mixer');
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

            function eduNav(view) {
              currentView = view;
              document.getElementById('edu-view-main').style.display = 'none';
              document.getElementById('edu-view-components').style.display = 'none';
              document.getElementById('edu-view-maintenance').style.display = 'none';
              document.getElementById('edu-view-step').style.display = 'none';
              
              const backBtn = document.getElementById('edu-back-btn');
              
              if (view === 'main') {
                backBtn.style.display = 'none';
                document.getElementById('edu-view-main').style.display = 'flex';
                document.getElementById('edu-title').innerText = '${panelTitle.replace(/'/g, "\\'")}';
              } else {
                backBtn.style.display = 'block';
                backBtn.onclick = () => {
                  if (view === 'step') eduNav('maintenance');
                  else eduNav('main');
                };
              }

              if (view === 'components') {
                document.getElementById('edu-title').innerText = 'ASSET INFO';
                const container = document.getElementById('edu-view-components');
                container.innerHTML = '';
                if (eduComponents.length === 0) container.innerHTML = '<p style="color:#94a3b8;font-size:12px;text-align:center;">Belum ada komponen terdaftar.</p>';
                eduComponents.forEach(comp => {
                  const btn = document.createElement('button');
                  btn.innerHTML = comp.name;
                  btn.style.cssText = 'width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 14px; border-radius: 10px; text-align: left; font-size: 14px; cursor: pointer; transition: background 0.2s;';
                  btn.onclick = () => {
                    playAnimation(comp.actionTargetId ? 'model-'+comp.actionTargetId : null, comp.actionAnimation);
                    btn.style.background = 'rgba(59, 130, 246, 0.4)';
                    setTimeout(() => btn.style.background = 'rgba(255,255,255,0.05)', 300);
                  };
                  container.appendChild(btn);
                });
                container.style.display = 'flex';
              }

              if (view === 'maintenance') {
                document.getElementById('edu-title').innerText = 'MAINTENANCE';
                const container = document.getElementById('edu-view-maintenance');
                container.innerHTML = '';
                if (eduTasks.length === 0) container.innerHTML = '<p style="color:#94a3b8;font-size:12px;text-align:center;">Belum ada tugas.</p>';
                eduTasks.forEach((task) => {
                  const btn = document.createElement('button');
                  btn.innerHTML = '🔧 ' + task.title;
                  btn.style.cssText = 'width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fbbf24; padding: 14px; border-radius: 10px; text-align: left; font-size: 14px; cursor: pointer; font-weight: bold;';
                  btn.onclick = () => {
                    currentTask = task;
                    currentStepIdx = 0;
                    eduNav('step');
                  };
                  container.appendChild(btn);
                });
                container.style.display = 'flex';
              }

              if (view === 'step') {
                document.getElementById('edu-title').innerText = currentTask.title;
                renderStep();
                document.getElementById('edu-view-step').style.display = 'flex';
              }
            }

            function renderStep() {
              if (!currentTask || currentTask.steps.length === 0) return;
              const step = currentTask.steps[currentStepIdx];
              document.getElementById('edu-step-title').innerText = 'LANGKAH ' + (currentStepIdx + 1) + ' DARI ' + currentTask.steps.length;
              document.getElementById('edu-step-instruction').innerText = step.instruction || '-';
              
              const nextBtn = document.getElementById('edu-step-next');
              if (currentStepIdx === currentTask.steps.length - 1) {
                nextBtn.innerText = '✅ Selesai';
                nextBtn.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
              } else {
                nextBtn.innerText = 'Langkah Selanjutnya ➔';
                nextBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
              }
              
              playAnimation(step.actionTargetId ? 'model-'+step.actionTargetId : null, step.actionAnimation);
            }

            function eduNextStep() {
              if (currentStepIdx < currentTask.steps.length - 1) {
                currentStepIdx++;
                renderStep();
              } else {
                eduNav('maintenance');
              }
            }
          </script>
          <style>
            @keyframes fadeInUp {
              from { opacity: 0; transform: translate(-50%, 30px); }
              to { opacity: 1; transform: translate(-50%, 0); }
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
