import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type Vec3 = [number, number, number];

interface RuntimeAction {
  type?: string;
  targetId?: string;
  value?: string;
}

interface RuntimeKeyframe {
  time?: number;
  position?: Vec3;
  rotation?: Vec3;
  scale?: Vec3;
  easing?: string;
}

interface RuntimeEduComponent {
  id?: string;
  name?: string;
  description?: string;
  actionTargetId?: string;
  actionAnimation?: string;
  showTargetId?: string;
  hideTargetId?: string;
}

interface RuntimeSubMeshAnimation {
  targetElementId?: string;
  targetSubMeshName?: string;
  keyframes?: RuntimeKeyframe[];
}

interface RuntimeEduStep {
  id?: string;
  stepNumber?: number;
  title?: string;
  instruction?: string;
  voiceoverUrl?: string;
  animations?: RuntimeSubMeshAnimation[];
  animationSource?: 'none' | 'blender' | 'editor' | 'submesh';
  actionTargetId?: string;
  actionAnimation?: string;
  showTargetId?: string;
  hideTargetId?: string;
}

interface RuntimeEduTask {
  id?: string;
  title?: string;
  description?: string;
  steps?: RuntimeEduStep[];
}

interface RuntimeEduTrigger {
  id?: string;
  label?: string;
  targetElementId?: string;
}

interface RuntimeElement {
  id: string;
  type: string;
  name?: string;
  url?: string;
  content?: string;
  color?: string;
  shapeType?: string;
  buttonText?: string;
  panelTitle?: string;
  hotspotText?: string;
  data?: { description?: string; showInARMenu?: boolean };
  position?: Vec3;
  rotation?: Vec3;
  scale?: Vec3;
  parentId?: string;
  sceneId?: string;
  isHidden?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  volume?: number;
  onClickActionType?: string;
  onClickActionValue?: string;
  onClickActions?: RuntimeAction[];
  availableAnimations?: string[];
  autoplayAnimation?: string;
  animationLoopMode?: 'loop' | 'once' | 'pingpong';
  animationSpeed?: number;
  keyframes?: RuntimeKeyframe[];
  eduComponents?: RuntimeEduComponent[];
  eduMaintenanceTasks?: RuntimeEduTask[];
  eduCustomTriggers?: RuntimeEduTrigger[];
  eduGeneralInfo?: { title?: string; description?: string };
}

interface RuntimeScene {
  id: string;
  name?: string;
}

interface ClientAction {
  type: 'open_url' | 'change_scene' | 'toggle_visibility' | 'play_audio' | 'play_animation';
  value?: string;
  targetId?: string;
}

interface EducationPayload {
  initialSceneId: string;
  scenes: Array<{ id: string; name: string }>;
  panels: Array<{
    id: string;
    sceneId: string;
    title: string;
    generalTitle: string;
    description: string;
    components: RuntimeEduComponent[];
    modules: RuntimeEduTask[];
    triggers: RuntimeEduTrigger[];
  }>;
  objects: Array<{
    id: string;
    sceneId: string;
    type: string;
    name: string;
    description: string;
    availableAnimations: string[];
    autoplayAnimation?: string;
    animationLoopMode: 'loop' | 'once' | 'pingpong';
    animationSpeed: number;
    keyframes: RuntimeKeyframe[];
  }>;
}

const DEFAULT_COLOR = '#ffffff';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function safeUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function safeColor(value: unknown): string {
  if (typeof value !== 'string') return DEFAULT_COLOR;
  return /^#[0-9a-f]{3,8}$/i.test(value) ? value : DEFAULT_COLOR;
}

function safeVec3(value: unknown, fallback: Vec3): Vec3 {
  if (!Array.isArray(value) || value.length !== 3) return fallback;
  const numbers = value.map(Number);
  return numbers.every(Number.isFinite) ? numbers as Vec3 : fallback;
}

function vecToAttribute(value: Vec3): string {
  return value.map((part) => Number(part.toFixed(6))).join(' ');
}

function rotationToDegrees(value: Vec3): string {
  return value.map((part) => Number(((part * 180) / Math.PI).toFixed(4))).join(' ');
}

function jsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026');
}

function errorPage(title: string, message: string): string {
  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; min-height: 100dvh; display: grid; place-items: center; padding: 24px; background: #070b14; color: #f8fafc; font: 16px/1.5 system-ui, sans-serif; }
      main { width: min(520px, 100%); padding: 28px; border: 1px solid #263244; border-radius: 20px; background: #111827; box-shadow: 0 24px 70px #0008; }
      h1 { margin: 0 0 10px; font-size: 1.35rem; }
      p { margin: 0; color: #aeb9ca; }

      /* AR Scanner Reticle HUD Overlay */
      .scanner-viewfinder {
        position: fixed;
        inset: 0;
        z-index: 9;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.35s ease, visibility 0.35s ease;
      }
      .scanner-viewfinder.active {
        opacity: 1;
        visibility: visible;
      }
      .scanner-reticle {
        position: relative;
        width: min(72vw, 290px);
        height: min(72vw, 290px);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 26px;
        background: radial-gradient(circle, color-mix(in srgb, var(--brand) 12%, transparent) 0%, transparent 72%);
        box-shadow: inset 0 0 35px rgba(0, 0, 0, 0.45);
        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease;
      }
      .scanner-corner {
        position: absolute;
        width: 26px;
        height: 26px;
        border-color: var(--brand);
        border-style: solid;
        filter: drop-shadow(0 0 8px var(--brand));
      }
      .corner-tl { top: -2px; left: -2px; border-width: 3.5px 0 0 3.5px; border-top-left-radius: 14px; }
      .corner-tr { top: -2px; right: -2px; border-width: 3.5px 3.5px 0 0; border-top-right-radius: 14px; }
      .corner-bl { bottom: -2px; left: -2px; border-width: 0 0 3.5px 3.5px; border-bottom-left-radius: 14px; }
      .corner-br { bottom: -2px; right: -2px; border-width: 0 3.5px 3.5px 0; border-bottom-right-radius: 14px; }
      
      .scanner-laser {
        position: absolute;
        left: 5%;
        right: 5%;
        height: 2.5px;
        background: linear-gradient(90deg, transparent, var(--brand) 30%, #ffffff 50%, var(--brand) 70%, transparent);
        box-shadow: 0 0 16px var(--brand);
        border-radius: 99px;
        animation: scanLaser 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
      }
      @keyframes scanLaser {
        0% { top: 7%; opacity: 0.85; }
        50% { opacity: 1; }
        100% { top: 91%; opacity: 0.85; }
      }
      .scanner-center-cross {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 16px;
        height: 16px;
      }
      .scanner-center-cross::before, .scanner-center-cross::after {
        content: '';
        position: absolute;
        background: rgba(255, 255, 255, 0.4);
      }
      .scanner-center-cross::before { top: 0; bottom: 0; left: 7px; width: 2px; }
      .scanner-center-cross::after { left: 0; right: 0; top: 7px; height: 2px; }

      .scanner-guidance {
        margin-top: 24px;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 9px 18px;
        border-radius: 999px;
        background: rgba(7, 11, 20, 0.86);
        border: 1px solid rgba(255, 255, 255, 0.18);
        box-shadow: 0 12px 36px rgba(0, 0, 0, 0.55);
        backdrop-filter: blur(16px);
        max-width: calc(100vw - 36px);
        animation: pulsePrompt 2.5s ease-in-out infinite alternate;
      }
      @keyframes pulsePrompt {
        from { transform: scale(1); }
        to { transform: scale(1.02); }
      }
      .scanner-target-preview {
        position: relative;
        width: 42px;
        height: 42px;
        flex-shrink: 0;
        border-radius: 11px;
        overflow: hidden;
        border: 2px solid var(--brand);
        box-shadow: 0 0 10px color-mix(in srgb, var(--brand) 40%, transparent);
        background: #000;
      }
      .scanner-target-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .scanner-guidance-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .scanner-guidance-text strong {
        font-size: 11.5px;
        color: #fff;
        font-weight: 800;
      }
      .scanner-guidance-text span {
        font-size: 10px;
        color: #94a3b8;
      }

      .scanner-locked-badge {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.65);
        opacity: 0;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 11px 22px;
        border-radius: 999px;
        background: rgba(16, 185, 129, 0.96);
        color: #ffffff;
        font-size: 13.5px;
        font-weight: 800;
        box-shadow: 0 14px 40px rgba(16, 185, 129, 0.5);
        backdrop-filter: blur(14px);
        transition: transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.25s ease;
      }
      .locked-icon {
        display: grid;
        place-items: center;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.28);
        font-size: 12px;
      }

      /* Locked & Fade out states */
      .scanner-viewfinder.target-locked .scanner-reticle {
        border-color: #10b981;
        box-shadow: 0 0 30px rgba(16, 185, 129, 0.4);
        transform: scale(0.95);
      }
      .scanner-viewfinder.target-locked .scanner-corner {
        border-color: #10b981;
        filter: drop-shadow(0 0 12px #10b981);
      }
      .scanner-viewfinder.target-locked .scanner-laser {
        display: none;
      }
      .scanner-viewfinder.target-locked .scanner-guidance {
        opacity: 0;
        transform: translateY(12px);
        transition: all 0.2s ease;
      }
      .scanner-viewfinder.target-locked .scanner-locked-badge {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
      .scanner-viewfinder.fade-out {
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.45s ease, visibility 0.45s ease;
      }
    </style>
  </head>
  <body><main><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p></main></body>
</html>`;
}

function getClientActions(element: RuntimeElement, validSceneIds: Set<string>): ClientAction[] {
  const actions: ClientAction[] = [];

  for (const action of element.onClickActions ?? []) {
    if (action.type === 'open_url') {
      const url = safeUrl(action.value);
      if (url) actions.push({ type: 'open_url', value: url });
    } else if (action.type === 'change_scene' && action.value && validSceneIds.has(action.value)) {
      actions.push({ type: 'change_scene', value: action.value });
    } else if (action.type === 'toggle_visibility' && action.targetId) {
      actions.push({ type: 'toggle_visibility', targetId: action.targetId });
    } else if (action.type === 'play_audio' && action.targetId) {
      actions.push({ type: 'play_audio', targetId: action.targetId });
    } else if (action.type === 'play_animation' && action.targetId && action.value) {
      actions.push({ type: 'play_animation', targetId: action.targetId, value: action.value });
    }
  }

  if (element.onClickActionType === 'url') {
    const url = safeUrl(element.onClickActionValue);
    if (url) actions.push({ type: 'open_url', value: url });
  } else if (
    element.onClickActionType === 'change_scene' &&
    element.onClickActionValue &&
    validSceneIds.has(element.onClickActionValue)
  ) {
    actions.push({ type: 'change_scene', value: element.onClickActionValue });
  }

  return actions;
}

function finiteNumber(value: unknown, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function normalizeKeyframes(value: unknown): RuntimeKeyframe[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((raw) => {
    if (!raw || typeof raw !== 'object') return [];
    const keyframe = raw as RuntimeKeyframe;
    return [{
      time: Math.max(0, finiteNumber(keyframe.time, 0)),
      position: keyframe.position ? safeVec3(keyframe.position, [0, 0, 0]) : undefined,
      rotation: keyframe.rotation ? safeVec3(keyframe.rotation, [0, 0, 0]) : undefined,
      scale: keyframe.scale ? safeVec3(keyframe.scale, [1, 1, 1]) : undefined,
      easing: stringValue(keyframe.easing, 'linear'),
    }];
  }).sort((a, b) => (a.time ?? 0) - (b.time ?? 0));
}

function buildEducationPayload(
  elements: RuntimeElement[],
  scenes: RuntimeScene[]
): EducationPayload {
  const initialSceneId = String(scenes[0]?.id ?? 'scene-1');
  const sceneIdFor = (element: RuntimeElement) => String(element.sceneId || initialSceneId);

  const panels = elements
    .filter((element) => element.type === 'edu_panel')
    .map((panel) => ({
      id: String(panel.id),
      sceneId: sceneIdFor(panel),
      title: stringValue(panel.panelTitle || panel.name, 'Panel Edukasi'),
      generalTitle: stringValue(panel.eduGeneralInfo?.title, 'Informasi General'),
      description: stringValue(panel.eduGeneralInfo?.description || panel.data?.description),
      components: (Array.isArray(panel.eduComponents) ? panel.eduComponents : []).map((component, index) => ({
        id: stringValue(component?.id, `component-${index}`),
        name: stringValue(component?.name, `Komponen ${index + 1}`),
        description: stringValue(component?.description),
        actionTargetId: stringValue(component?.actionTargetId) || undefined,
        actionAnimation: stringValue(component?.actionAnimation) || undefined,
        showTargetId: stringValue(component?.showTargetId) || undefined,
        hideTargetId: stringValue(component?.hideTargetId) || undefined,
      })),
      modules: (Array.isArray(panel.eduMaintenanceTasks) ? panel.eduMaintenanceTasks : []).map((task, taskIndex) => ({
        id: stringValue(task?.id, `module-${taskIndex}`),
        title: stringValue(task?.title, `Modul ${taskIndex + 1}`),
        description: stringValue(task?.description),
        steps: (Array.isArray(task?.steps) ? task.steps : []).map((step, stepIndex) => ({
          id: stringValue(step?.id, `step-${stepIndex}`),
          stepNumber: finiteNumber(step?.stepNumber, stepIndex + 1),
          title: stringValue(step?.title, `Langkah ${stepIndex + 1}`),
          instruction: stringValue(step?.instruction),
          voiceoverUrl: safeUrl(step?.voiceoverUrl) ?? undefined,
          animationSource: step?.animationSource,
          animations: (Array.isArray(step?.animations) ? step.animations : []).map((animation) => ({
            targetElementId: stringValue(animation?.targetElementId),
            targetSubMeshName: stringValue(animation?.targetSubMeshName),
            keyframes: normalizeKeyframes(animation?.keyframes),
          })).filter((animation) => animation.targetElementId && animation.targetSubMeshName && animation.keyframes.length > 0),
          actionTargetId: stringValue(step?.actionTargetId) || undefined,
          actionAnimation: stringValue(step?.actionAnimation) || undefined,
          showTargetId: stringValue(step?.showTargetId) || undefined,
          hideTargetId: stringValue(step?.hideTargetId) || undefined,
        })),
      })),
      triggers: (Array.isArray(panel.eduCustomTriggers) ? panel.eduCustomTriggers : []).map((trigger, index) => ({
        id: stringValue(trigger?.id, `trigger-${index}`),
        label: stringValue(trigger?.label, `Aksi ${index + 1}`),
        targetElementId: stringValue(trigger?.targetElementId),
      })).filter((trigger) => trigger.targetElementId),
    }));

  const objects = elements
    .filter((element) => (
      element.type !== 'edu_panel' &&
      !['ambient_light', 'directional_light'].includes(element.type) &&
      element.data?.showInARMenu !== false
    ))
    .map((element): EducationPayload['objects'][number] => ({
      id: String(element.id),
      sceneId: sceneIdFor(element),
      type: element.type,
      name: stringValue(element.name, 'Objek AR'),
      description: stringValue(element.data?.description),
      availableAnimations: (Array.isArray(element.availableAnimations) ? element.availableAnimations : [])
        .filter((animation): animation is string => typeof animation === 'string' && animation.trim().length > 0),
      autoplayAnimation: stringValue(element.autoplayAnimation) || undefined,
      animationLoopMode: element.animationLoopMode === 'once' || element.animationLoopMode === 'pingpong'
        ? element.animationLoopMode
        : 'loop',
      animationSpeed: Math.max(0.05, finiteNumber(element.animationSpeed, 1)),
      keyframes: normalizeKeyframes(element.keyframes),
    }));

  return {
    initialSceneId,
    scenes: scenes.map((scene, index) => ({
      id: String(scene.id),
      name: stringValue(scene.name, `Scene ${index + 1}`),
    })),
    panels,
    objects,
  };
}

function renderExperience(project: Record<string, unknown>): string {
  const rawSceneData = project.scene_data && typeof project.scene_data === 'object'
    ? project.scene_data as Record<string, unknown>
    : {};
  const elements = Array.isArray(rawSceneData.elements)
    ? rawSceneData.elements.filter((item): item is RuntimeElement => Boolean(item && typeof item === 'object' && 'id' in item && 'type' in item))
    : [];
  const storedScenes = Array.isArray(rawSceneData.scenes)
    ? rawSceneData.scenes.filter((item): item is RuntimeScene => Boolean(item && typeof item === 'object' && 'id' in item))
    : [];
  const scenes = storedScenes.length > 0 ? storedScenes : [{ id: 'scene-1', name: 'Scene 1' }];
  const sceneIds = new Set(scenes.map((scene) => String(scene.id)));
  const mindFileUrl = safeUrl(project.mind_file_url);
  const targetImageUrl = safeUrl(project.target_image_url) || safeUrl((rawSceneData as any).targetImageUrl);

  if (!mindFileUrl) {
    return errorPage(
      'Marker AR belum siap',
      'Proyek ini belum memiliki file marker MindAR yang valid. Buka editor lalu Publish ulang proyek.'
    );
  }

  const childrenByParent = new Map<string, RuntimeElement[]>();
  for (const element of elements) {
    if (!element.parentId) continue;
    const children = childrenByParent.get(element.parentId) ?? [];
    children.push(element);
    childrenByParent.set(element.parentId, children);
  }

  const modelAssetIds = new Map<string, string>();
  const videoAssetIds = new Map<string, string>();
  const assets: string[] = [];

  elements.forEach((element, index) => {
    const url = safeUrl(element.url);
    if (!url) return;

    if (element.type === '3d_model') {
      const assetId = `model-${index}`;
      modelAssetIds.set(element.id, assetId);
      assets.push(`<a-asset-item id="${assetId}" src="${escapeHtml(url)}" crossorigin="anonymous"></a-asset-item>`);
    } else if (element.type === 'video') {
      const assetId = `video-${index}`;
      videoAssetIds.set(element.id, assetId);
      assets.push(`<video id="${assetId}" src="${escapeHtml(url)}" crossorigin="anonymous" playsinline webkit-playsinline muted ${element.loop ? 'loop' : ''} ${element.autoplay ? 'autoplay' : ''}></video>`);
    }
  });

  const actionMap: Record<string, ClientAction[]> = {};
  for (const element of elements) {
    const actions = getClientActions(element, sceneIds);
    if (actions.length > 0) actionMap[element.id] = actions;
  }
  const educationPayload = buildEducationPayload(elements, scenes);
  const educationObjectIds = new Set(educationPayload.objects.map((element) => element.id));
  const hasEducationContent = educationPayload.panels.length > 0;

  const renderElement = (element: RuntimeElement, visited: Set<string>): string => {
    if (visited.has(element.id)) return '';
    // Edu panels are screen-space controls. Rendering them as a plane inside
    // the tracked marker caused the large empty rectangle seen in public AR.
    if (element.type === 'edu_panel') return '';
    const nextVisited = new Set(visited).add(element.id);
    const position = safeVec3(element.position, [0, 0, 0]);
    const rotation = safeVec3(element.rotation, [0, 0, 0]);
    const scale = safeVec3(element.scale, [1, 1, 1]);
    const color = safeColor(element.color);
    const elementId = escapeHtml(element.id);
    const children = (childrenByParent.get(element.id) ?? [])
      .map((child) => renderElement(child, nextVisited))
      .join('');
    const interactiveClass = actionMap[element.id] || educationObjectIds.has(element.id) ? ' class="interactive"' : '';
    const common = `position="${vecToAttribute(position)}" rotation="${rotationToDegrees(rotation)}" scale="${vecToAttribute(scale)}" visible="${element.isHidden ? 'false' : 'true'}" data-element-id="${elementId}"${interactiveClass}`;
    let visual = '';

    if (element.type === '3d_model') {
      const assetId = modelAssetIds.get(element.id);
      if (assetId) visual = `<a-gltf-model src="#${assetId}" data-model-for="${elementId}"></a-gltf-model>`;
    } else if (element.type === '3d_shape') {
      const primitives: Record<string, string> = {
        cube: 'box', sphere: 'sphere', cylinder: 'cylinder', plane: 'plane',
        cone: 'cone', torus: 'torus', tetrahedron: 'tetrahedron', icosahedron: 'icosahedron',
      };
      const primitive = primitives[element.shapeType ?? 'cube'] ?? 'box';
      visual = `<a-entity geometry="primitive: ${primitive}" material="color: ${color}; side: double; metalness: 0.05; roughness: 0.8"></a-entity>`;
    } else if (element.type === '3d_text') {
      visual = `<a-text value="${escapeHtml(element.content || 'Text')}" color="${color}" align="center" anchor="center" side="double"></a-text>`;
    } else if (element.type === 'image') {
      const url = safeUrl(element.url);
      if (url) visual = `<a-image src="${escapeHtml(url)}" crossorigin="anonymous" material="side: double"></a-image>`;
    } else if (element.type === 'video') {
      const assetId = videoAssetIds.get(element.id);
      if (assetId) visual = `<a-video src="#${assetId}" material="side: double"></a-video>`;
    } else if (element.type === 'audio') {
      const url = safeUrl(element.url);
      if (url) {
        const volume = Number.isFinite(Number(element.volume)) ? Math.min(1, Math.max(0, Number(element.volume))) : 1;
        visual = `<a-sound src="url(${escapeHtml(url)})" autoplay="${Boolean(element.autoplay)}" loop="${Boolean(element.loop)}" volume="${volume}"></a-sound>`;
      }
    } else if (element.type === 'ui_button') {
      visual = `<a-plane width="2.4" height="0.62" color="${color === DEFAULT_COLOR ? '#2563eb' : color}" material="side: double"></a-plane><a-text value="${escapeHtml(element.buttonText || element.name || 'Button')}" color="#ffffff" align="center" anchor="center" position="0 0 0.01" width="3.2"></a-text>`;
    } else if (element.type === 'hotspot') {
      visual = `<a-circle radius="0.28" color="${color === DEFAULT_COLOR ? '#f59e0b' : color}" material="side: double"></a-circle><a-text value="${escapeHtml(element.hotspotText || element.name || 'Info')}" color="#ffffff" align="center" anchor="center" position="0 -0.46 0.01" width="2.5"></a-text>`;
    }

    return `<a-entity ${common}>${visual}${children}</a-entity>`;
  };

  const sceneMarkup = scenes.map((scene, sceneIndex) => {
    const sceneId = String(scene.id);
    const sceneElements = elements.filter((element) => {
      if (element.parentId) return false;
      const elementSceneId = element.sceneId || scenes[0].id;
      return String(elementSceneId) === sceneId;
    });
    return `<a-entity data-scene-root="${escapeHtml(sceneId)}" visible="${sceneIndex === 0 ? 'true' : 'false'}">${sceneElements.map((element) => renderElement(element, new Set())).join('')}</a-entity>`;
  }).join('');

  const brandColor = typeof project.brand_color === 'string' && /^#[0-9a-f]{3,8}$/i.test(project.brand_color)
    ? project.brand_color
    : '#2563eb';
  const projectTitle = escapeHtml(project.title || 'AR Experience');
  const logoUrl = safeUrl(project.brand_logo_url);

  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
    <meta name="theme-color" content="#05070b" />
    <title>${projectTitle}</title>
    <script src="https://aframe.io/releases/1.6.0/aframe.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js"></script>
    <style>
      :root { --brand: ${brandColor}; color-scheme: dark; }
      * { box-sizing: border-box; }
      /* Warna latar hanya di html. MindAR menaruh <video> kamera dengan z-index negatif,
         jadi background body harus transparan, kalau tidak video tertutup dan layar tampak hitam. */
      html { width: 100%; height: 100%; margin: 0; overflow: hidden; background: #05070b; }
      body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: transparent; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
      a-scene { position: fixed !important; inset: 0; }
      #topbar { position: fixed; z-index: 8; top: max(14px, env(safe-area-inset-top)); left: 14px; right: 14px; display: flex; align-items: center; justify-content: space-between; pointer-events: none; }
      .brand { display: flex; align-items: center; gap: 9px; max-width: 70vw; padding: 8px 11px; border: 1px solid #ffffff26; border-radius: 999px; color: #fff; background: #070b14b8; backdrop-filter: blur(12px); box-shadow: 0 8px 24px #0005; }
      .brand img { width: 26px; height: 26px; border-radius: 50%; object-fit: contain; background: #fff; }
      .brand span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; font-weight: 700; }
      #status { padding: 8px 11px; border-radius: 999px; color: #fff; background: #070b14b8; backdrop-filter: blur(12px); font-size: 11px; }
      #status::before { content: ''; display: inline-block; width: 7px; height: 7px; margin-right: 7px; border-radius: 50%; background: var(--brand); box-shadow: 0 0 12px var(--brand); }
      #start-overlay { position: fixed; z-index: 10; inset: 0; display: grid; place-items: center; padding: 24px; background: radial-gradient(circle at 50% 25%, #172554 0, #070b14 55%, #020409 100%); }
      #start-card { width: min(430px, 100%); padding: 30px; border: 1px solid #ffffff20; border-radius: 24px; text-align: center; background: #0f172acc; backdrop-filter: blur(16px); box-shadow: 0 28px 90px #000a; }
      #start-card h1 { margin: 0 0 8px; color: #fff; font-size: clamp(22px, 6vw, 30px); }
      #start-card p { margin: 0 0 22px; color: #aeb9ca; line-height: 1.55; }
      #start-button { width: 100%; border: 0; border-radius: 14px; padding: 14px 18px; color: #fff; background: var(--brand); font: inherit; font-weight: 800; cursor: pointer; box-shadow: 0 12px 30px color-mix(in srgb, var(--brand) 40%, transparent); }
      #start-button:disabled { cursor: wait; opacity: .65; }
      #retry-button { display: none; width: 100%; margin-top: 10px; border: 1px solid #ffffff2e; border-radius: 14px; padding: 12px 18px; color: #fff; background: #ffffff12; font: inherit; font-weight: 700; cursor: pointer; }
      #hint { position: fixed; z-index: 8; left: 50%; bottom: max(18px, env(safe-area-inset-bottom)); transform: translateX(-50%); width: max-content; max-width: calc(100vw - 32px); padding: 9px 13px; border-radius: 999px; color: #dbeafe; background: #070b14b8; backdrop-filter: blur(12px); text-align: center; font-size: 11px; opacity: 0; transition: opacity .25s; pointer-events: none; }
      #hint.visible { opacity: 1; }
    </style>
    ${hasEducationContent ? '<link rel="stylesheet" href="/ar-education-runtime.css" />' : ''}
  </head>
  <body>
    <div id="topbar">
      <div class="brand">${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="" />` : ''}<span>${projectTitle}</span></div>
      <div id="status">Siap</div>
    </div>
    <div id="hint">Arahkan kamera ke gambar marker</div>
    <!-- Modern AR Scanner Viewfinder Overlay -->
    <div id="scanner-viewfinder" class="scanner-viewfinder" aria-hidden="true">
      <div class="scanner-reticle">
        <div class="scanner-corner corner-tl"></div>
        <div class="scanner-corner corner-tr"></div>
        <div class="scanner-corner corner-bl"></div>
        <div class="scanner-corner corner-br"></div>
        <div class="scanner-laser"></div>
        <div class="scanner-center-cross"></div>
      </div>
      <div class="scanner-guidance">
        ${targetImageUrl ? `
        <div class="scanner-target-preview">
          <img src="${escapeHtml(targetImageUrl)}" alt="Marker Target" />
        </div>` : ''}
        <div class="scanner-guidance-text">
          <strong>Arahkan Kamera ke Marker</strong>
          <span>Posisikan gambar marker di dalam bingkai kotak</span>
        </div>
      </div>
      <div class="scanner-locked-badge">
        <span class="locked-icon">✓</span>
        <span>Marker Terkunci</span>
      </div>
    </div>
    ${hasEducationContent ? `<div id="edu-runtime" hidden>
      <button id="edu-dock" type="button" aria-controls="edu-sheet" aria-expanded="false">
        <span class="edu-dock-icon" aria-hidden="true">✦</span>
        <span class="edu-dock-copy"><strong id="edu-dock-title">Panel Edukasi</strong><small id="edu-dock-meta">Buka informasi dan animasi</small></span>
        <span class="edu-dock-open" aria-hidden="true">Buka</span>
      </button>
      <div id="edu-backdrop" aria-hidden="true"></div>
      <section id="edu-sheet" role="dialog" aria-modal="true" aria-labelledby="edu-title" aria-hidden="true">
        <div class="edu-grabber" aria-hidden="true"></div>
        <header class="edu-header">
          <div><span class="edu-eyebrow">MODE BELAJAR AR</span><h2 id="edu-title">Panel Edukasi</h2></div>
          <button id="edu-close" class="edu-icon-button" type="button" aria-label="Tutup panel edukasi">×</button>
        </header>
        <nav id="edu-tabs" class="edu-tabs" aria-label="Menu edukasi">
          <button type="button" data-edu-tab="components" aria-selected="true">Komponen</button>
          <button type="button" data-edu-tab="maintenance" aria-selected="false">Maintenance</button>
          <button type="button" data-edu-tab="general" aria-selected="false">General</button>
        </nav>
        <div id="edu-content" class="edu-content" aria-live="polite"></div>
      </section>
      <div id="edu-toast" role="status" aria-live="polite"></div>
    </div>` : ''}
    <div id="start-overlay">
      <main id="start-card">
        <h1>${projectTitle}</h1>
        <p>Izinkan akses kamera, lalu arahkan perangkat ke gambar marker untuk memulai pengalaman AR.</p>
        <button id="start-button" type="button" disabled>Menyiapkan AR…</button>
        <button id="retry-button" type="button">Muat Ulang</button>
      </main>
    </div>
    <a-scene
      mindar-image="imageTargetSrc: ${escapeHtml(mindFileUrl)}; autoStart: false; uiLoading: yes; uiScanning: no; uiError: yes; warmupTolerance: 3; missTolerance: 8; filterMinCF: 0.001; filterBeta: 1000;"
      color-space="sRGB"
      renderer="colorManagement: true; physicallyCorrectLights: true; antialias: true; alpha: true"
      vr-mode-ui="enabled: false"
      device-orientation-permission-ui="enabled: false"
      embedded
    >
      <a-assets timeout="20000">${assets.join('')}</a-assets>
      <a-camera position="0 0 0" look-controls="enabled: false">
        <a-cursor fuse="false" raycaster="objects: .interactive"></a-cursor>
      </a-camera>
      <a-entity mindar-image-target="targetIndex: 0">
        <a-entity light="type: ambient; intensity: 1.4"></a-entity>
        <a-entity light="type: directional; intensity: 1.2" position="1 2 1"></a-entity>
        ${sceneMarkup}
      </a-entity>
    </a-scene>
    <script>
      (() => {
        const actions = ${jsonForScript(actionMap)};
        const scene = document.querySelector('a-scene');
        const target = document.querySelector('[mindar-image-target]');
        const overlay = document.getElementById('start-overlay');
        const startButton = document.getElementById('start-button');
        const retryButton = document.getElementById('retry-button');
        const status = document.getElementById('status');
        const hint = document.getElementById('hint');
        let started = false;

        const setStatus = (text) => { status.textContent = text; };
        const showError = (message) => {
          started = false;
          overlay.style.display = 'grid';
          startButton.style.display = 'none';
          retryButton.style.display = 'block';
          document.querySelector('#start-card p').textContent = message;
          setStatus('Kamera gagal');
        };
        const start = () => {
          if (started) return;
          if (!scene.systems?.['mindar-image-system']) {
            showError('Mesin MindAR belum siap. Muat ulang halaman lalu coba lagi.');
            return;
          }
          started = true;
          startButton.disabled = true;
          startButton.textContent = 'Memuat kamera…';
          setStatus('Memuat');
          try {
            scene.systems['mindar-image-system'].start();
          } catch (error) {
            showError(error instanceof Error ? error.message : 'AR tidak dapat dimulai.');
          }
        };

        const enableStart = () => {
          startButton.disabled = false;
          startButton.textContent = 'Mulai AR';
        };
        if (scene.hasLoaded) enableStart();
        else scene.addEventListener('loaded', enableStart, { once: true });

        startButton.addEventListener('click', start);
        retryButton.addEventListener('click', () => location.reload());
        scene.addEventListener('arReady', () => {
          overlay.style.display = 'none';
          hint.classList.add('visible');
          setStatus('Mencari marker');
        });
        scene.addEventListener('arError', () => showError('Kamera tidak dapat digunakan. Pastikan izin kamera aktif dan halaman dibuka melalui HTTPS.'));
        target.addEventListener('targetFound', () => {
          hint.classList.remove('visible');
          setStatus('Marker ditemukan');
          window.dispatchEvent(new CustomEvent('ar-target-found'));
        });
        target.addEventListener('targetLost', () => {
          hint.classList.add('visible');
          setStatus('Mencari marker');
        });

        const entities = new Map(
          Array.from(document.querySelectorAll('[data-element-id]')).map((element) => [element.dataset.elementId, element])
        );
        const sceneRoots = Array.from(document.querySelectorAll('[data-scene-root]'));
        const setScene = (sceneId) => {
          sceneRoots.forEach((root) => root.setAttribute('visible', String(root.dataset.sceneRoot === sceneId)));
          window.dispatchEvent(new CustomEvent('ar-scene-change', { detail: { sceneId } }));
        };
        document.querySelectorAll('.interactive').forEach((entity) => {
          entity.addEventListener('click', () => {
            for (const action of actions[entity.dataset.elementId] || []) {
              if (action.type === 'open_url' && action.value) {
                window.open(action.value, '_blank', 'noopener,noreferrer');
              } else if (action.type === 'change_scene' && action.value) {
                setScene(action.value);
              } else if (action.type === 'toggle_visibility' && action.targetId) {
                const targetEntity = entities.get(action.targetId);
                if (targetEntity) {
                  const current = targetEntity.getAttribute('visible');
                  targetEntity.setAttribute('visible', String(!(current === true || current === 'true')));
                }
              } else if (action.type === 'play_audio' && action.targetId) {
                const audioEntity = entities.get(action.targetId);
                audioEntity?.components?.sound?.playSound();
              } else if (action.type === 'play_animation' && action.targetId && action.value) {
                window.dispatchEvent(new CustomEvent('ar-play-animation', {
                  detail: { targetId: action.targetId, animationName: action.value }
                }));
              }
            }
          });
        });
      })();
    </script>
    ${hasEducationContent ? `<script id="edu-runtime-data" type="application/json">${jsonForScript(educationPayload)}</script>
    <script src="/ar-education-runtime.js"></script>` : ''}
  </body>
</html>`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return new NextResponse(errorPage('Konfigurasi server belum lengkap', 'Supabase URL atau anonymous key belum tersedia.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: project, error } = await supabase
      .from('ar_projects')
      .select('id, title, brand_color, brand_logo_url, mind_file_url, target_image_url, scene_data')
      .eq('id', id)
      .single();

    if (error || !project) {
      return new NextResponse(errorPage('Proyek tidak ditemukan', 'Link AR ini tidak valid atau proyek tidak lagi tersedia.'), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const hasMindFile = Boolean(safeUrl(project.mind_file_url));
    return new NextResponse(renderExperience(project), {
      status: hasMindFile ? 200 : 422,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Permissions-Policy': 'camera=(self)',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Failed to render MindAR experience', error);
    return new NextResponse(errorPage('AR gagal dimuat', 'Terjadi kesalahan pada server. Silakan coba lagi beberapa saat.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
