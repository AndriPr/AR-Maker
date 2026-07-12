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
        return `<a-gltf-model src="#asset-${el.id}" position="${posStr}" rotation="${rotStr}" scale="${scaleStr}"></a-gltf-model>`;
      }
      
      if (el.type === '3d_text') {
        return `<a-text value="${el.content || 'Text'}" color="${el.color || '#ffffff'}" position="${posStr}" rotation="${rotStr}" scale="${scaleStr}" align="center"></a-text>`;
      }

      return '';
    }).join('\n        ');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
          <script src="https://aframe.io/releases/1.3.0/aframe.min.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/mind-ar@1.2.2/dist/mindar-image-aframe.prod.js"></script>
          <style>
            body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: transparent; }
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
