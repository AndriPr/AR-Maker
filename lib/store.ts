import { create } from 'zustand';
import * as THREE from 'three';
import { transformDragState } from '@/lib/viewportRefs';

// Snaps a raw timeline time to the nearest exact frame boundary for the given
// fps, so a keyframe placed at "frame 1" is stored at that frame's exact time
// instead of a coarse 0.1s-rounded value that visually drifts from the playhead.
function snapTimeToFrame(time: number, fps: number): number {
  const safeFps = Math.max(1, Math.round(fps));
  return Math.round(Math.max(0, time) * safeFps) / safeFps;
}

export type KeyframeEasing = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce';

export interface SceneKeyframe {
  id: string;
  time: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  easing?: KeyframeEasing;
  bezierHandles?: [number, number, number, number];
}

type ElementType = 'group_folder' | '3d_model' | '3d_shape' | '3d_text' | 'image' | 'video' | 'ui_button' | 'edu_panel' | 'audio' | 'vfx_sparkles' | 'hotspot' | 'occluder_plane' | 'occluder_cube';

export interface EduComponent {
  id: string;
  name: string;
  description?: string;
  actionTargetId?: string;
  actionAnimation?: string;
  showTargetId?: string;
  hideTargetId?: string;
}

export interface EduGeneralInfo {
  title: string;
  description: string;
}

export type EduAnimationSource = 'none' | 'blender' | 'editor' | 'submesh';

export interface TransformKeyframe {
  time: number;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  easing: 'linear' | 'easeInOutQuad' | 'smoothstep';
}

export interface SubMeshAnimation {
  targetElementId: string;
  targetSubMeshName: string;
  keyframes: TransformKeyframe[];
}

export interface EduMaintenanceStep {
  id: string;
  stepNumber: number;
  title: string;
  instruction: string;
  voiceoverUrl?: string;
  animations: SubMeshAnimation[];
  animationSource?: EduAnimationSource;
  
  // Legacy fields (optional backward compatibility)
  actionTargetId?: string;
  actionAnimation?: string;
  showTargetId?: string;
  hideTargetId?: string;
}

export interface EduMaintenanceTask {
  id: string;
  title: string;
  description?: string;
  steps: EduMaintenanceStep[];
}

type ActionType = 'play_animation' | 'play_audio' | 'toggle_visibility' | 'open_url' | 'change_scene' | 'play_timeline_range';

interface ElementAction {
  id: string;
  type: ActionType;
  targetId?: string; // ID of the target element (for animation, audio, visibility)
  value?: string;    // URL for 'open_url', Scene ID for 'change_scene', or Animation Name
}

export interface EduCustomTrigger {
  id: string;
  label: string;
  targetElementId: string;
}

export interface SceneElement {
  id: string;
  type: ElementType;
  name: string;
  url?: string;         // For models, images, videos
  content?: string;     // For text
  color?: string;       // For text and shapes
  is3D?: boolean;       // For text
  fontFamily?: string;  // For text
  textEffect?: string;  // For text (none, outline, glow)
  shapeType?: 'cube' | 'sphere' | 'cylinder' | 'plane' | 'cone' | 'torus' | 'tetrahedron' | 'icosahedron'; // For 3d shapes
  
  // Interactivity Properties
  availableAnimations?: string[]; // Extracted from 3D model GLTF
  // Phase 4: Advanced Animations
  autoplayAnimation?: string;
  animationLoopMode?: 'loop' | 'once' | 'pingpong';
  animationSpeed?: number;

  availableMaterials?: string[];  // Extracted material names from 3D model
  customMaterials?: Record<string, string>; // Material name -> hex color
  buttonText?: string;            // For UI button
  actionTargetId?: string;        // (Legacy) The ID of the model to animate
  actionAnimation?: string;       // (Legacy) The name of the animation to play
  
  // No-Code On-Click Actions (For any element)
  onClickActionType?: 'none' | 'url' | 'audio' | 'animation' | 'change_scene'; // Legacy
  onClickActionValue?: string; // Legacy
  
  onClickActions?: ElementAction[]; // Advanced Triggers (New)
  isHidden?: boolean; // Default visibility state
  isLocked?: boolean;
  isJoint?: boolean; // Selectability state (Blender Outliner)
  eduCustomTriggers?: EduCustomTrigger[];
  
  // Audio Properties
  loop?: boolean;
  autoplay?: boolean;
  volume?: number;

  // Video Hologram Properties
  chromaKey?: boolean;
  chromaKeyColor?: string;

  // Edu Panel Properties
  panelTitle?: string;
  eduGeneralInfo?: EduGeneralInfo;
  eduComponents?: EduComponent[];
  eduMaintenanceTasks?: EduMaintenanceTask[];

  // VFX Properties
  sparkleColor?: string;
  sparkleCount?: number;
  sparkleSize?: number;

  // Hotspot Properties
  hotspotText?: string;

  // Real-time Data (IoT)
  apiEndpoint?: string;
  apiJsonPath?: string;

  // Multi-Scene
  sceneId?: string;

  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  
  entranceAnimation?: 'none' | 'fade' | 'scale' | 'slide-up';
  idleAnimation?: 'none' | 'rotate' | 'hover' | 'both';
  idleAnimationSpeed?: number;

  visibilityMode?: 'visible' | 'hidden'; // For 3D models toggling
  isTimelineExpanded?: boolean; // For expanding Sub-tracks in Timeline
  
  // Phase 7: Mesh Separation
  targetMeshName?: string; // If set, only render this specific mesh from the GLTF
  meshPositionOffset?: [number, number, number]; // Visual offset to center the pivot
  availableSubMeshes?: {
    name: string;
    position: [number, number, number];
    offset: [number, number, number];
    quaternion?: [number, number, number, number];
    scale?: [number, number, number];
  }[];
  
  data?: any; // For dynamic data properties like Edu Panel description
  
  // Phase 8: Grouping
  parentId?: string; // If set, this element renders relative to its parent group

  // Keyframe Animations (Phase 3)
  keyframes?: SceneKeyframe[];
}

type TransformUpdate = Pick<Partial<SceneElement>, 'position' | 'rotation' | 'scale'>;

function upsertTransformKeyframe(
  element: SceneElement,
  transform: TransformUpdate,
  time: number,
  fps: number,
  easing: KeyframeEasing
): SceneElement {
  const snappedTime = snapTimeToFrame(time, fps);
  const frameTolerance = 0.5 / Math.max(1, fps);
  const keyframes = [...(element.keyframes || [])];
  const existingIndex = keyframes.findIndex(keyframe => Math.abs(keyframe.time - snappedTime) < frameTolerance);

  if (existingIndex >= 0) {
    keyframes[existingIndex] = {
      ...keyframes[existingIndex],
      ...transform,
      time: snappedTime,
      easing: keyframes[existingIndex].easing || easing
    };
  } else {
    keyframes.push({
      id: Math.random().toString(36).substring(2, 9),
      time: snappedTime,
      ...transform,
      easing
    });
  }

  keyframes.sort((a, b) => a.time - b.time);
  return { ...element, ...transform, keyframes };
}

interface EditorState {
  selectedSubMesh: { elementId: string, meshName: string } | null;
  setSelectedSubMesh: (subMesh: { elementId: string, meshName: string } | null) => void;
  currentARStepIndex: number;
  currentARModuleIndex: number;
  arPlaybackProgress: number;
  setArPlaybackProgress: (p: number) => void;
  setCurrentARStepIndex: (index: number) => void;
  setCurrentARModuleIndex: (index: number) => void;
  
  activeTriggers: string[];
  toggleTrigger: (triggerId: string) => void;

  elements: SceneElement[];
  selectedId: string | null;
  targetImageUrl: string | null;
  previewAnimationData: { targetId: string, animationName: string } | null;
  isSnapping: boolean;
  
  // Transform Locks (Blender Parity)
  axisLock: 'x' | 'y' | 'z' | null;
  setAxisLock: (axis: 'x' | 'y' | 'z' | null) => void;
  
  // Professional Modeling
  transformSpace: 'world' | 'local';
  setTransformSpace: (space: 'world' | 'local') => void;
  snapGrid: number;
  setSnapGrid: (value: number) => void;
  
  // Logic Nodes
  nodes: any[];
  edges: any[];
  setNodes: (nodes: any[] | ((prev: any[]) => any[])) => void;
  setEdges: (edges: any[] | ((prev: any[]) => any[])) => void;
  updateNodeData: (id: string, data: any) => void;
  logicVariables: Record<string, any>;
  setLogicVariable: (key: string, value: any) => void;
  onNodesChange: (changes: any[]) => void;
  onEdgesChange: (changes: any[]) => void;
  
  // Environment
  ambientLightIntensity: number;
  directionalLightIntensity: number;
  environmentMap: 'none' | 'studio' | 'city' | 'sunset' | 'forest' | 'apartment';
  
  viewportShading: 'solid' | 'wireframe';
  setViewportShading: (mode: 'solid' | 'wireframe') => void;
  
  // Multi-Scene
  scenes: { id: string; name: string }[];
  currentSceneId: string;
  
  // History
  past: SceneElement[][];
  future: SceneElement[][];

  // Actions
  setElements: (elements: SceneElement[]) => void;
  setTargetImageUrl: (url: string | null) => void;
  setPreviewAnimationData: (data: { targetId: string, animationName: string } | null) => void;
  addElement: (element: Omit<SceneElement, 'id'>) => void;
  updateElement: (id: string, element: Partial<SceneElement>, options?: { skipHistory?: boolean }) => void;
  commitTransform: (primaryId: string, transform: TransformUpdate, positionDelta?: [number, number, number]) => void;
  removeElement: (id: string) => void;
  removeElements: (ids: string[]) => void;
  duplicateElement: (id: string) => void;
  explodeModel: (id: string) => void;
  setSelectedId: (id: string | null) => void;
  
  // Phase 9: Multi-select & Grouping
  multiSelectedIds: string[];
  setMultiSelectedIds: (ids: string[]) => void;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  groupSelectedElements: () => void;
    joinSelectedElements: () => void;
  reparentElement: (childId: string, newParentId: string | undefined) => void;
  handleElementClick: (id: string, ctrlKey: boolean, shiftKey: boolean) => void;
  
  // Undo/Redo
  setIsSnapping: (val: boolean) => void;
  isTransforming: boolean;
  lastTransformEndTime?: number;
  setIsTransforming: (val: boolean) => void;
  isOrthographic: boolean;
  setIsOrthographic: (val: boolean) => void;
  isSimulating: boolean;
  setIsSimulating: (val: boolean) => void;
  isScanningAR: boolean;
  setIsScanningAR: (val: boolean) => void;
  setAmbientLightIntensity: (val: number) => void;
  setDirectionalLightIntensity: (val: number) => void;
  setEnvironmentMap: (map: 'none' | 'studio' | 'city' | 'sunset' | 'forest' | 'apartment') => void;
  
  // Scene Management
  addScene: (name: string) => void;
  setScenes: (scenes: { id: string; name: string }[]) => void;
  setCurrentSceneId: (id: string) => void;
  removeScene: (id: string) => void;

  undo: () => void;
  redo: () => void;
  
  // Camera
  cameraResetTrigger: number;
  isShiftPressed: boolean;
  setIsShiftPressed: (pressed: boolean) => void;
  triggerCameraReset: () => void;
  cameraFocusTarget: [number, number, number] | null;
  setCameraFocusTarget: (target: [number, number, number] | null) => void;

  // Timeline
  timelineTime: number;
  setTimelineTime: (time: number) => void;
  timelinePlaying: boolean;
  timelineLooping: boolean;
  setTimelineLooping: (loop: boolean) => void;
  setTimelinePlaying: (playing: boolean) => void;
  showTimeline: boolean;
  setShowTimeline: (show: boolean) => void;
  isAutoKeying: boolean;
  currentEasing: KeyframeEasing;
  setCurrentEasing: (easing: KeyframeEasing) => void;
  addKeyframe: (id?: string) => void;
  updateKeyframe: (elementId: string, keyframeId: string, updates: Partial<SceneKeyframe>) => void;
  removeKeyframes: (keyframes: { elementId: string, id: string }[]) => void;
  setIsAutoKeying: (autoKeying: boolean) => void;
  
  // Advanced Animation Features (Phase 10)
  playbackRange: [number, number] | null;
  setPlaybackRange: (range: [number, number] | null) => void;
  playbackDirection: 1 | -1;
  setPlaybackDirection: (dir: 1 | -1) => void;
  selectedKeyframes: { elementId: string, id: string }[];
  setSelectedKeyframes: (kfs: { elementId: string, id: string }[]) => void;
  fps: number;
  setFps: (fps: number) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  elements: [],
  selectedSubMesh: null,
  setSelectedSubMesh: (subMesh: { elementId: string, meshName: string } | null) => set({ selectedSubMesh: subMesh }),
  currentARStepIndex: 0,
  currentARModuleIndex: 0,
  arPlaybackProgress: 0,
  setArPlaybackProgress: (p) => set({ arPlaybackProgress: p }),
  setCurrentARStepIndex: (index: number) => set({ currentARStepIndex: index }),
  setCurrentARModuleIndex: (index: number) => set({ currentARModuleIndex: index, currentARStepIndex: 0 }),

  activeTriggers: [],
  toggleTrigger: (id: string) => set((state) => ({
    activeTriggers: state.activeTriggers.includes(id) 
      ? state.activeTriggers.filter(t => t !== id)
      : [...state.activeTriggers, id]
  })),

  selectedId: null,
  multiSelectedIds: [],
  hoveredId: null,
  targetImageUrl: null,
  previewAnimationData: null,
  isSnapping: false,
  axisLock: null,
  setAxisLock: (axis) => set({ axisLock: axis }),
  transformSpace: 'world',
  setTransformSpace: (space) => set({ transformSpace: space }),
  snapGrid: 0.5,
  setSnapGrid: (value) => set({ snapGrid: value }),
  nodes: [],
  edges: [],
  logicVariables: {},
  isOrthographic: false,
  isSimulating: false,
  isScanningAR: false,
  ambientLightIntensity: 0.5,
  directionalLightIntensity: 1,
  environmentMap: 'none',
  viewportShading: 'solid',
  scenes: [{ id: 'scene-1', name: 'Scene 1' }],
  currentSceneId: 'scene-1',
  past: [],
  future: [],
  cameraResetTrigger: 0,
  isShiftPressed: false,
  setIsShiftPressed: (pressed) => set({ isShiftPressed: pressed }),
  cameraFocusTarget: null,
  timelineTime: 0,
  timelinePlaying: false,
  timelineLooping: false,
  showTimeline: false,
  isAutoKeying: false,
  currentEasing: 'linear',
  playbackRange: null,
  playbackDirection: 1,
  selectedKeyframes: [],
  fps: 30,

  setElements: (elements) => set({
    // Backfill ids on keyframes from older saved projects - everything downstream
    // (React keys, select/remove/update) identifies a keyframe by id, not time,
    // since two keyframes can land at the same or near-identical time.
    elements: elements.map(el => {
      if (!el.keyframes || el.keyframes.length === 0) return el;
      let changed = false;
      const keyframes = el.keyframes.map(kf => {
        if (kf.id) return kf;
        changed = true;
        return { ...kf, id: Math.random().toString(36).substring(2, 9) };
      });
      return changed ? { ...el, keyframes } : el;
    }),
    selectedId: null,
    multiSelectedIds: [],
    selectedKeyframes: [],
    past: [],
    future: []
  }),
  
  setTargetImageUrl: (url) => set({ targetImageUrl: url }),
  setPreviewAnimationData: (data) => set({ previewAnimationData: data }),
  
  setNodes: (nodesUpdater) => set((state) => ({ nodes: typeof nodesUpdater === 'function' ? nodesUpdater(state.nodes) : nodesUpdater })),
  setEdges: (edgesUpdater) => set((state) => ({ edges: typeof edgesUpdater === 'function' ? edgesUpdater(state.edges) : edgesUpdater })),
  updateNodeData: (id, data) => set((state) => ({
    nodes: state.nodes.map((node) => {
      if (node.id === id) {
        return { ...node, data: { ...node.data, ...data } };
      }
      return node;
    })
  })),
  setLogicVariable: (key, value) => set((state) => ({
    logicVariables: { ...state.logicVariables, [key]: value }
  })),
  onNodesChange: (changes) => set((state) => {
    return { nodes: state.nodes };
  }),
  onEdgesChange: (changes) => set((state) => {
    return { edges: state.edges };
  }),
  
  addElement: (element) => set((state) => {
    const newElement = { 
      ...element, 
      id: Math.random().toString(36).substring(2, 9),
      sceneId: element.sceneId || state.currentSceneId
    };
    return {
      past: [...state.past, state.elements],
      future: [],
      elements: [...state.elements, newElement],
      selectedId: newElement.id
    };
  }),

  updateElement: (id, data, options) => set((state) => {
    // INTERCEPT AUTO-KEYING
    if (state.isAutoKeying) {
      // Check if data contains transform changes (position, rotation, scale)
      const hasTransformChanges = 'position' in data || 'rotation' in data || 'scale' in data;
      
      if (hasTransformChanges && !('keyframes' in data)) {
        const transform: TransformUpdate = {};
        if (data.position) transform.position = data.position;
        if (data.rotation) transform.rotation = data.rotation;
        if (data.scale) transform.scale = data.scale;

        return {
          past: [...state.past, state.elements],
          future: [],
          elements: state.elements.map(element => element.id === id
            ? upsertTransformKeyframe(element, transform, state.timelineTime, state.fps, state.currentEasing)
            : element)
        };
      }
    }

    const nextElements = state.elements.map((el) =>
      el.id === id ? { ...el, ...data } : el
    );

    // Auto-derived metadata writes (available sub-meshes/animations/materials
    // extracted from a loaded GLTF) shouldn't create an undo step - the user
    // never asked for this change and it wasn't their edit to undo.
    if (options?.skipHistory) {
      return { elements: nextElements };
    }

    return {
      past: [...state.past, state.elements],
      future: [],
      elements: nextElements
    };
  }),

  commitTransform: (primaryId, transform, positionDelta) => set((state) => {
    const primary = state.elements.find(element => element.id === primaryId);
    if (!primary) return state;

    const selectedForDelta = new Set(state.multiSelectedIds);
    const nextElements = state.elements.map(element => {
      let nextTransform: TransformUpdate | null = null;

      if (element.id === primaryId) {
        nextTransform = transform;
      } else if (positionDelta && selectedForDelta.has(primaryId) && selectedForDelta.has(element.id)) {
        nextTransform = {
          position: [
            element.position[0] + positionDelta[0],
            element.position[1] + positionDelta[1],
            element.position[2] + positionDelta[2]
          ]
        };
      }

      if (!nextTransform) return element;
      if (state.isAutoKeying) {
        return upsertTransformKeyframe(element, nextTransform, state.timelineTime, state.fps, state.currentEasing);
      }
      return { ...element, ...nextTransform };
    });

    return {
      past: [...state.past, state.elements],
      future: [],
      elements: nextElements
    };
  }),

  removeElement: (id) => set((state) => {
    const getChildrenIds = (parentId: string): string[] => {
      const children = state.elements.filter(e => e.parentId === parentId);
      return [...children.map(c => c.id), ...children.flatMap(c => getChildrenIds(c.id))];
    };
    const idsToRemove = [id, ...getChildrenIds(id)];

    return {
      past: [...state.past, state.elements],
      future: [],
      elements: state.elements.filter((el) => !idsToRemove.includes(el.id)),
      selectedId: state.selectedId && idsToRemove.includes(state.selectedId) ? null : state.selectedId,
      multiSelectedIds: state.multiSelectedIds.filter(selected => !idsToRemove.includes(selected)),
      selectedKeyframes: state.selectedKeyframes.filter(keyframe => !idsToRemove.includes(keyframe.elementId))
    };
  }),

  removeElements: (ids) => set((state) => {
    const getChildrenIds = (parentId: string): string[] => {
      const children = state.elements.filter(e => e.parentId === parentId);
      return [...children.map(c => c.id), ...children.flatMap(c => getChildrenIds(c.id))];
    };
    const allIdsToRemove = new Set<string>();
    ids.forEach(id => {
      allIdsToRemove.add(id);
      getChildrenIds(id).forEach(childId => allIdsToRemove.add(childId));
    });

    return {
      past: [...state.past, state.elements],
      future: [],
      elements: state.elements.filter((el) => !allIdsToRemove.has(el.id)),
      selectedId: state.selectedId && allIdsToRemove.has(state.selectedId) ? null : state.selectedId,
      multiSelectedIds: state.multiSelectedIds.filter(selected => !allIdsToRemove.has(selected)),
      selectedKeyframes: state.selectedKeyframes.filter(keyframe => !allIdsToRemove.has(keyframe.elementId))
    };
  }),

  duplicateElement: (id) => set((state) => {
    const element = state.elements.find(el => el.id === id);
    if (!element) return state;
    
    const newElement = {
      ...element,
      id: Math.random().toString(36).substring(2, 9),
      position: [element.position[0] + 0.5, element.position[1], element.position[2] + 0.5] as [number, number, number],
      name: `${element.name} (Copy)`
    };
    
    return {
      past: [...state.past, state.elements],
      future: [],
      elements: [...state.elements, newElement],
      selectedId: newElement.id
    };
  }),

  explodeModel: (id) => set((state) => {
    const el = state.elements.find(e => e.id === id);
    if (!el || el.type !== '3d_model' || !el.availableSubMeshes || el.availableSubMeshes.length === 0) return state;

    const newElements = el.availableSubMeshes.map(subMesh => {
      if (subMesh.quaternion && subMesh.scale) {
        const parentMatrix = new THREE.Matrix4().compose(
          new THREE.Vector3(...el.position),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(...el.rotation)),
          new THREE.Vector3(...el.scale)
        );

        const localMatrix = new THREE.Matrix4().compose(
          new THREE.Vector3(...subMesh.position),
          new THREE.Quaternion(...subMesh.quaternion),
          new THREE.Vector3(...subMesh.scale)
        );

        const worldMatrix = parentMatrix.multiply(localMatrix);

        const newPos = new THREE.Vector3();
        const newQuat = new THREE.Quaternion();
        const newScale = new THREE.Vector3();
        worldMatrix.decompose(newPos, newQuat, newScale);
        
        const newEuler = new THREE.Euler().setFromQuaternion(newQuat);

        return {
          ...el,
          id: Math.random().toString(36).substring(2, 9),
          name: subMesh.name,
          targetMeshName: subMesh.name,
          meshPositionOffset: undefined,
          position: [newPos.x, newPos.y, newPos.z] as [number, number, number],
          rotation: [newEuler.x, newEuler.y, newEuler.z] as [number, number, number],
          scale: [newScale.x, newScale.y, newScale.z] as [number, number, number],
          availableSubMeshes: undefined,
          keyframes: []
        };
      } else {
        const parentPos = new THREE.Vector3(...el.position);
        const parentRot = new THREE.Euler(...el.rotation);
        const parentScale = new THREE.Vector3(...el.scale);
        
        const localCenter = new THREE.Vector3(...subMesh.position);
        localCenter.multiply(parentScale);
        localCenter.applyEuler(parentRot);
        
        const newPos = parentPos.add(localCenter);

        return {
          ...el,
          id: Math.random().toString(36).substring(2, 9),
          name: subMesh.name,
          targetMeshName: subMesh.name,
          meshPositionOffset: subMesh.offset,
          position: [newPos.x, newPos.y, newPos.z] as [number, number, number],
          availableSubMeshes: undefined,
          keyframes: []
        };
      }
    });

    return {
      past: [...state.past, state.elements],
      future: [],
      elements: [...state.elements.filter(e => e.id !== id), ...newElements],
      selectedId: null
    };
  }),

  setSelectedId: (id) => set({ selectedId: id, multiSelectedIds: [], selectedKeyframes: [] }),
  setMultiSelectedIds: (ids) => set({ multiSelectedIds: ids, selectedKeyframes: [] }),
  setHoveredId: (id) => set({ hoveredId: id }),
  handleElementClick: (id, ctrlKey, shiftKey) => set((state) => {
    // Swallow the ghost click that follows a TransformControls drag release
    // (see transformDragState) so it can't re-select the parent folder.
    if (transformDragState.suppressNextClick) {
      transformDragState.suppressNextClick = false;
      return state;
    }

    // Redirect selection to parent if part of a Joint Object
    let targetId = id;
    const el = state.elements.find(e => e.id === id);
    if (el && el.parentId) {
       const parent = state.elements.find(p => p.id === el.parentId);
       if (parent && parent.isJoint) {
          targetId = parent.id;
       }
    }
    id = targetId;
    
    if (ctrlKey) {
      // Toggle single item selection
      const isMulti = state.multiSelectedIds.includes(id);
      const isPrimary = state.selectedId === id;
      if (isMulti || isPrimary) {
        return {
          multiSelectedIds: state.multiSelectedIds.filter(mid => mid !== id),
          selectedId: isPrimary ? null : state.selectedId,
          selectedKeyframes: []
        };
      } else {
        return { multiSelectedIds: [...state.multiSelectedIds, id], selectedKeyframes: [] };
      }
    } else if (shiftKey) {
      // Range select based on visual store order
      if (!state.selectedId) {
         return { selectedId: id, multiSelectedIds: [], selectedKeyframes: [] };
      }
      const startIndex = state.elements.findIndex(e => e.id === state.selectedId);
      const endIndex = state.elements.findIndex(e => e.id === id);
      if (startIndex === -1 || endIndex === -1) {
         return { selectedId: id, multiSelectedIds: [], selectedKeyframes: [] };
      }
      const min = Math.min(startIndex, endIndex);
      const max = Math.max(startIndex, endIndex);
      const rangeIds = state.elements.slice(min, max + 1).map(e => e.id);
      
      return { multiSelectedIds: Array.from(new Set([...state.multiSelectedIds, ...rangeIds])), selectedKeyframes: [] };
    } else {
      return { selectedId: id, multiSelectedIds: [], selectedKeyframes: [] };
    }
  }),
  
  joinSelectedElements: () => set((state) => {
    const allSelected = state.selectedId 
      ? [state.selectedId, ...state.multiSelectedIds].filter((v, i, a) => a.indexOf(v) === i) 
      : state.multiSelectedIds;
      
    if (allSelected.length < 2) return state; // Need at least 2 elements to join
    
    const firstEl = state.elements.find(e => e.id === allSelected[0]);
    if (!firstEl) return state;
    
    const selectedElements = state.elements.filter(e => allSelected.includes(e.id));
    
    // Calculate the center of all selected elements
    let sumX = 0, sumY = 0, sumZ = 0;
    selectedElements.forEach(e => {
       sumX += e.position[0];
       sumY += e.position[1];
       sumZ += e.position[2];
    });
    const centerX = sumX / selectedElements.length;
    const centerY = sumY / selectedElements.length;
    const centerZ = sumZ / selectedElements.length;

    const newGroupId = Math.random().toString(36).substring(2, 9);
    const newGroup: SceneElement = {
      id: newGroupId,
      type: 'group_folder',
      name: 'Joint Object',
      position: [centerX, centerY, centerZ],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      isJoint: true,
      sceneId: firstEl.sceneId || state.currentSceneId,
      parentId: firstEl.parentId
    };
    
    const newElements = state.elements.map(el => {
      if (allSelected.includes(el.id)) {
        return { 
          ...el, 
          parentId: newGroupId,
          position: [el.position[0] - centerX, el.position[1] - centerY, el.position[2] - centerZ] as [number, number, number]
        };
      }
      return el;
    });
    
    return {
      elements: [...newElements, newGroup],
      selectedId: newGroupId,
      multiSelectedIds: []
    };
  }),
  groupSelectedElements: () => set((state) => {
    const allSelected = state.selectedId 
      ? [state.selectedId, ...state.multiSelectedIds].filter((v, i, a) => a.indexOf(v) === i) 
      : state.multiSelectedIds;
      
    if (allSelected.length < 2) return state; // Need at least 2 elements to group
    
    const firstEl = state.elements.find(e => e.id === allSelected[0]);
    if (!firstEl) return state;
    
    const selectedElements = state.elements.filter(e => allSelected.includes(e.id));
    
    // Calculate the center of all selected elements
    let sumX = 0, sumY = 0, sumZ = 0;
    selectedElements.forEach(e => {
       sumX += e.position[0];
       sumY += e.position[1];
       sumZ += e.position[2];
    });
    const centerX = sumX / selectedElements.length;
    const centerY = sumY / selectedElements.length;
    const centerZ = sumZ / selectedElements.length;

    const newGroupId = Math.random().toString(36).substring(2, 9);
    const newGroup: SceneElement = {
      id: newGroupId,
      type: 'group_folder',
      name: 'Group ' + Math.floor(Math.random() * 100),
      position: [centerX, centerY, centerZ],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      sceneId: firstEl.sceneId || state.currentSceneId,
      parentId: firstEl.parentId // Optional: place group in the same parent as the first selected item
    };
    
    const newElements = state.elements.map(el => {
      if (allSelected.includes(el.id)) {
        // Offset the child's position relative to the new group's center
        return { 
          ...el, 
          parentId: newGroupId,
          position: [
            el.position[0] - centerX,
            el.position[1] - centerY,
            el.position[2] - centerZ
          ] as [number, number, number]
        };
      }
      return el;
    });

    return {
      elements: [...newElements, newGroup],
      selectedId: newGroupId,
      multiSelectedIds: [],
      past: [...state.past, state.elements],
      future: []
    };
  }),
  reparentElement: (childId, newParentId) => set((state) => {
    const child = state.elements.find(e => e.id === childId);
    if (!child || child.parentId === newParentId) return state;

    // Helper to get simple world position
    const getWorldPos = (elId: string | undefined): [number, number, number] => {
      let x = 0, y = 0, z = 0;
      let curr = state.elements.find(e => e.id === elId);
      while (curr) {
        x += curr.position[0];
        y += curr.position[1];
        z += curr.position[2];
        curr = state.elements.find(e => e.id === curr!.parentId);
      }
      return [x, y, z];
    };

    const oldWorld = getWorldPos(childId);
    const newParentWorld = getWorldPos(newParentId);

    const newLocal: [number, number, number] = [
      oldWorld[0] - newParentWorld[0],
      oldWorld[1] - newParentWorld[1],
      oldWorld[2] - newParentWorld[2]
    ];

    const newElements = state.elements.map(el => 
      el.id === childId ? { ...el, parentId: newParentId, position: newLocal } : el
    );

    return {
      elements: newElements,
      past: [...state.past, state.elements],
      future: []
    };
  }),
  setIsSnapping: (val) => set({ isSnapping: val }),
  isTransforming: false,
  setIsTransforming: (val: boolean) => set(state => { if (!val) return { isTransforming: val, lastTransformEndTime: performance.now() }; return { isTransforming: val }; }),
  setIsOrthographic: (val) => set({ isOrthographic: val }),
  
  setIsSimulating: (val) => set({ 
    isSimulating: val, 
    selectedId: val ? null : get().selectedId,
    isScanningAR: val // Set scanning to true when simulation starts
  }),
  setIsScanningAR: (val) => set({ isScanningAR: val }),
  setAmbientLightIntensity: (val) => set({ ambientLightIntensity: val }),
  setDirectionalLightIntensity: (val) => set({ directionalLightIntensity: val }),
  setEnvironmentMap: (map) => set({ environmentMap: map }),
  setViewportShading: (mode) => set({ viewportShading: mode }),

  addScene: (name) => set((state) => {
    const newSceneId = `scene-${Math.random().toString(36).substring(2, 9)}`;
    return {
      scenes: [...state.scenes, { id: newSceneId, name }],
      currentSceneId: newSceneId
    };
  }),
  setScenes: (scenes) => set({ scenes }),
  setCurrentSceneId: (id) => set({ currentSceneId: id, selectedId: null }),
  removeScene: (id) => set((state) => {
    if (state.scenes.length <= 1) return state;
    const newScenes = state.scenes.filter(s => s.id !== id);
    const newElements = state.elements.filter(el => el.sceneId !== id);
    return {
      past: [...state.past, state.elements],
      future: [],
      scenes: newScenes,
      elements: newElements,
      currentSceneId: state.currentSceneId === id ? newScenes[0].id : state.currentSceneId,
      selectedId: null
    };
  }),

  undo: () => set((state) => {
    if (state.past.length === 0) return state;
    const previous = state.past[state.past.length - 1];
    const newPast = state.past.slice(0, state.past.length - 1);
    return {
      past: newPast,
      future: [state.elements, ...state.future],
      elements: previous,
      selectedId: null // Reset selection on undo to avoid selecting deleted objects
    };
  }),

  redo: () => set((state) => {
    if (state.future.length === 0) return state;
    const next = state.future[0];
    const newFuture = state.future.slice(1);
    return {
      past: [...state.past, state.elements],
      future: newFuture,
      elements: next,
      selectedId: null
    };
  }),

  triggerCameraReset: () => set((state) => ({ cameraResetTrigger: state.cameraResetTrigger + 1, cameraFocusTarget: null })),
  setCameraFocusTarget: (target) => set({ cameraFocusTarget: target }),
  
  setTimelineTime: (time) => set({ timelineTime: Number.isFinite(time) ? Math.max(0, time) : 0 }),
  setTimelinePlaying: (playing) => set({ timelinePlaying: playing }),
  setTimelineLooping: (loop) => set({ timelineLooping: loop }),
  setShowTimeline: (show) => set({ showTimeline: show }),
  setIsAutoKeying: (autoKeying) => set({ isAutoKeying: autoKeying }),
  setCurrentEasing: (easing) => set({ currentEasing: easing }),
  setPlaybackRange: (range) => set({
    playbackRange: range
      ? [Math.max(0, Math.min(range[0], range[1])), Math.max(0, Math.max(range[0], range[1]))]
      : null
  }),
  setPlaybackDirection: (dir) => set({ playbackDirection: dir }),
  setSelectedKeyframes: (kfs) => set({ selectedKeyframes: kfs }),
  setFps: (fps) => set({ fps: Number.isFinite(fps) ? Math.max(1, Math.min(240, Math.round(fps))) : 30 }),
  
  addKeyframe: (specificId?: string) => set((state) => {
    const idToKeyframe = specificId || state.selectedId;
    if (!idToKeyframe) return state;
    
    const targetElement = state.elements.find(e => e.id === idToKeyframe);
    if (!targetElement) return state;

    const currentKeyframes = targetElement.keyframes || [];
    // Half a frame of tolerance - wide enough to re-key the same frame, narrow
    // enough that two keyframes only 1 frame apart (as little as 1/fps seconds,
    // e.g. ~0.033s at 30fps) don't get merged into a single overwritten one.
    const snappedTime = snapTimeToFrame(state.timelineTime, state.fps);
    const frameTolerance = 0.5 / state.fps;
    const existingIndex = currentKeyframes.findIndex(kf => Math.abs(kf.time - snappedTime) < frameTolerance);

    const newKeyframe = {
      id: Math.random().toString(36).substring(2, 9),
      time: snappedTime,
      position: [...targetElement.position] as [number, number, number],
      rotation: [...targetElement.rotation] as [number, number, number],
      scale: [...targetElement.scale] as [number, number, number],
      easing: state.currentEasing
    };

    let updatedKeyframes;
    if (existingIndex >= 0) {
      updatedKeyframes = [...currentKeyframes];
      updatedKeyframes[existingIndex] = {
        ...updatedKeyframes[existingIndex],
        ...newKeyframe,
        id: updatedKeyframes[existingIndex].id
      };
    } else {
      updatedKeyframes = [...currentKeyframes, newKeyframe as any].sort((a, b) => a.time - b.time);
    }

    return {
      past: [...state.past, state.elements],
      future: [],
      elements: state.elements.map((el) => 
        el.id === idToKeyframe ? { ...el, keyframes: updatedKeyframes } : el
      )
    };
  }),

  updateKeyframe: (elementId, keyframeId, updates) => set((state) => {
    const element = state.elements.find(item => item.id === elementId);
    const current = element?.keyframes?.find(keyframe => keyframe.id === keyframeId);
    if (!element || !current) return state;

    const requestedTime = updates.time ?? current.time;
    const snappedTime = snapTimeToFrame(requestedTime, state.fps);
    const frameTolerance = 0.5 / state.fps;
    const collision = element.keyframes?.find(keyframe =>
      keyframe.id !== keyframeId && Math.abs(keyframe.time - snappedTime) < frameTolerance
    );
    const merged: SceneKeyframe = {
      ...(collision || {}),
      ...current,
      ...updates,
      id: current.id,
      time: snappedTime
    };
    const updatedKeyframes = (element.keyframes || [])
      .filter(keyframe => keyframe.id !== keyframeId && keyframe.id !== collision?.id)
      .concat(merged)
      .sort((a, b) => a.time - b.time);

    return {
      past: [...state.past, state.elements],
      future: [],
      elements: state.elements.map(item => item.id === elementId ? { ...item, keyframes: updatedKeyframes } : item)
    };
  }),

  removeKeyframes: (keyframesToRemove) => set((state) => {
    if (keyframesToRemove.length === 0) return state;
    const idsByElement = new Map<string, Set<string>>();
    keyframesToRemove.forEach(({ elementId, id }) => {
      const ids = idsByElement.get(elementId) || new Set<string>();
      ids.add(id);
      idsByElement.set(elementId, ids);
    });

    let changed = false;
    const nextElements = state.elements.map(element => {
      const ids = idsByElement.get(element.id);
      if (!ids || !element.keyframes) return element;
      const keyframes = element.keyframes.filter(keyframe => !ids.has(keyframe.id));
      if (keyframes.length === element.keyframes.length) return element;
      changed = true;
      return { ...element, keyframes };
    });
    if (!changed) return state;

    return {
      past: [...state.past, state.elements],
      future: [],
      elements: nextElements,
      selectedKeyframes: state.selectedKeyframes.filter(({ elementId, id }) => !idsByElement.get(elementId)?.has(id))
    };
  }),
}));
