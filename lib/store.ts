import { create } from 'zustand';
import * as THREE from 'three';

export type ElementType = 'group_folder' | '3d_model' | '3d_shape' | '3d_text' | 'image' | 'video' | 'ui_button' | 'edu_panel' | 'audio' | 'vfx_sparkles' | 'hotspot' | 'occluder_plane' | 'occluder_cube';

export interface EduComponent {
  id: string;
  name: string;
  actionTargetId?: string;
  actionAnimation?: string;
  showTargetId?: string;
  hideTargetId?: string;
}

export interface EduMaintenanceStep {
  id: string;
  instruction: string;
  actionTargetId?: string;
  actionAnimation?: string;
  showTargetId?: string;
  hideTargetId?: string;
}

export interface EduMaintenanceTask {
  id: string;
  title: string;
  steps: EduMaintenanceStep[];
}

export type ActionType = 'play_animation' | 'play_audio' | 'toggle_visibility' | 'open_url' | 'change_scene';

export interface ElementAction {
  id: string;
  type: ActionType;
  targetId?: string; // ID of the target element (for animation, audio, visibility)
  value?: string;    // URL for 'open_url', Scene ID for 'change_scene', or Animation Name
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
  
  // Audio Properties
  loop?: boolean;
  autoplay?: boolean;
  volume?: number;

  // Video Hologram Properties
  chromaKey?: boolean;
  chromaKeyColor?: string;

  // Edu Panel Properties
  panelTitle?: string;
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
  }[];
  
  // Phase 8: Grouping
  parentId?: string; // If set, this element renders relative to its parent group

  // Keyframe Animations (Phase 3)
  keyframes?: {
    time: number; // in seconds
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
    easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce';
  }[];
}

interface EditorState {
  elements: SceneElement[];
  selectedId: string | null;
  targetImageUrl: string | null;
  previewAnimationData: { targetId: string, animationName: string } | null;
  isSnapping: boolean;
  
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
  
  // Project Settings
  trackingMode: 'image' | 'face' | 'cylinder';
  multisetMapId: string;

  // Environment
  ambientLightIntensity: number;
  directionalLightIntensity: number;
  environmentMap: 'none' | 'studio' | 'city' | 'sunset' | 'forest' | 'apartment';
  
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
  updateElement: (id: string, element: Partial<SceneElement>) => void;
  removeElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  explodeModel: (id: string) => void;
  setSelectedId: (id: string | null) => void;
  
  // Phase 9: Multi-select & Grouping
  multiSelectedIds: string[];
  setMultiSelectedIds: (ids: string[]) => void;
  groupSelectedElements: () => void;
  handleElementClick: (id: string, shiftKey: boolean) => void;
  
  // Undo/Redo
  setIsSnapping: (val: boolean) => void;
  isOrthographic: boolean;
  setIsOrthographic: (val: boolean) => void;
  isSimulating: boolean;
  setIsSimulating: (val: boolean) => void;
  setTrackingMode: (mode: 'image' | 'face' | 'cylinder') => void;
  setMultisetMapId: (id: string) => void;
  setAmbientLightIntensity: (val: number) => void;
  setDirectionalLightIntensity: (val: number) => void;
  setEnvironmentMap: (map: 'none' | 'studio' | 'city' | 'sunset' | 'forest' | 'apartment') => void;
  
  // Scene Management
  addScene: (name: string) => void;
  setCurrentSceneId: (id: string) => void;
  removeScene: (id: string) => void;

  undo: () => void;
  redo: () => void;
  
  // Camera
  cameraResetTrigger: number;
  triggerCameraReset: () => void;

  // Timeline
  timelineTime: number;
  setTimelineTime: (time: number) => void;
  timelinePlaying: boolean;
  setTimelinePlaying: (playing: boolean) => void;
  isAutoKeying: boolean;
  setIsAutoKeying: (autoKeying: boolean) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  elements: [],
  selectedId: null,
  multiSelectedIds: [],
  targetImageUrl: null,
  previewAnimationData: null,
  isSnapping: true,
  nodes: [],
  edges: [],
  logicVariables: {},
  isOrthographic: false,
  isSimulating: false,
  trackingMode: 'image',
  multisetMapId: '',
  ambientLightIntensity: 0.8,
  directionalLightIntensity: 1.8,
  environmentMap: 'none',
  scenes: [{ id: 'scene-1', name: 'Scene 1' }],
  currentSceneId: 'scene-1',
  past: [],
  future: [],
  cameraResetTrigger: 0,
  timelineTime: 0,
  timelinePlaying: false,
  isAutoKeying: false,

  setElements: (elements) => set({ elements }),
  
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

  updateElement: (id, data) => set((state) => {
    // INTERCEPT AUTO-KEYING
    if (state.isAutoKeying && state.timelineTime > 0) {
      // Check if data contains transform changes (position, rotation, scale)
      const hasTransformChanges = 'position' in data || 'rotation' in data || 'scale' in data;
      
      if (hasTransformChanges && !('keyframes' in data)) {
        return {
          elements: state.elements.map(e => {
            if (e.id !== id) return e;
            
            let kfs = [...(e.keyframes || [])];
            let existingKfIndex = kfs.findIndex(k => Math.abs(k.time - state.timelineTime) < 0.05);
            
            if (existingKfIndex >= 0) {
              // Update existing keyframe with ONLY the changed properties
              const updatedKf = { ...kfs[existingKfIndex] };
              if ('position' in data) updatedKf.position = data.position;
              if ('rotation' in data) updatedKf.rotation = data.rotation;
              if ('scale' in data) updatedKf.scale = data.scale;
              kfs[existingKfIndex] = updatedKf;
            } else {
              // Create new property-specific keyframe
              const newKf: any = { time: state.timelineTime };
              if ('position' in data) newKf.position = data.position;
              if ('rotation' in data) newKf.rotation = data.rotation;
              if ('scale' in data) newKf.scale = data.scale;
              kfs.push(newKf);
              kfs.sort((a, b) => a.time - b.time);
            }
            
            return { ...e, keyframes: kfs };
          })
        };
      }
    }

    return {
      past: [...state.past, state.elements],
      future: [],
      elements: state.elements.map((el) => 
        el.id === id ? { ...el, ...data } : el
      )
    };
  }),

  removeElement: (id) => set((state) => ({
    past: [...state.past, state.elements],
    future: [],
    elements: state.elements.filter((el) => el.id !== id),
    selectedId: state.selectedId === id ? null : state.selectedId
  })),

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
    });

    return {
      past: [...state.past, state.elements],
      future: [],
      elements: [...state.elements.filter(e => e.id !== id), ...newElements],
      selectedId: null
    };
  }),

  setSelectedId: (id) => set({ selectedId: id, multiSelectedIds: [] }),
  setMultiSelectedIds: (ids) => set({ multiSelectedIds: ids }),
  handleElementClick: (id, shiftKey) => set((state) => {
    if (shiftKey) {
      const isMulti = state.multiSelectedIds.includes(id);
      const isPrimary = state.selectedId === id;
      if (isMulti || isPrimary) {
        return {
          multiSelectedIds: state.multiSelectedIds.filter(mid => mid !== id),
          selectedId: isPrimary ? null : state.selectedId
        };
      } else {
        return { multiSelectedIds: [...state.multiSelectedIds, id] };
      }
    } else {
      return { selectedId: id, multiSelectedIds: [] };
    }
  }),
  groupSelectedElements: () => set((state) => {
    const allSelected = state.selectedId 
      ? [state.selectedId, ...state.multiSelectedIds].filter((v, i, a) => a.indexOf(v) === i) 
      : state.multiSelectedIds;
      
    if (allSelected.length < 2) return state; // Need at least 2 elements to group
    
    const firstEl = state.elements.find(e => e.id === allSelected[0]);
    if (!firstEl) return state;
    
    const newGroupId = Math.random().toString(36).substring(2, 9);
    const newGroup: SceneElement = {
      id: newGroupId,
      type: 'group_folder',
      name: 'Group ' + Math.floor(Math.random() * 100),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      sceneId: firstEl.sceneId || state.currentSceneId,
      parentId: firstEl.parentId // Optional: place group in the same parent as the first selected item
    };
    
    const newElements = state.elements.map(el => {
      if (allSelected.includes(el.id)) {
        return { ...el, parentId: newGroupId };
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
  setIsSnapping: (val) => set({ isSnapping: val }),
  setIsOrthographic: (val) => set({ isOrthographic: val }),
  setIsSimulating: (val) => set({ isSimulating: val, selectedId: val ? null : get().selectedId }),
  setTrackingMode: (mode) => set({ trackingMode: mode }),
  setMultisetMapId: (id) => set({ multisetMapId: id }),
  setAmbientLightIntensity: (val) => set({ ambientLightIntensity: val }),
  setDirectionalLightIntensity: (val) => set({ directionalLightIntensity: val }),
  setEnvironmentMap: (map) => set({ environmentMap: map }),

  addScene: (name) => set((state) => {
    const newSceneId = `scene-${Math.random().toString(36).substring(2, 9)}`;
    return {
      scenes: [...state.scenes, { id: newSceneId, name }],
      currentSceneId: newSceneId
    };
  }),
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

  triggerCameraReset: () => set((state) => ({ cameraResetTrigger: state.cameraResetTrigger + 1 })),
  
  setTimelineTime: (time) => set({ timelineTime: time }),
  setTimelinePlaying: (playing) => set({ timelinePlaying: playing }),
  setIsAutoKeying: (autoKeying) => set({ isAutoKeying: autoKeying }),
}));
