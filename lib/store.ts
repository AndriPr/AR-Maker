import { create } from 'zustand';

export type ElementType = '3d_model' | '3d_shape' | '3d_text' | 'image' | 'video' | 'ui_button' | 'edu_panel' | 'audio' | 'vfx_sparkles' | 'hotspot';

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
  
  // Advanced Animations
  entranceAnimation?: 'none' | 'fade' | 'scale' | 'slide-up';
  idleAnimation?: 'none' | 'rotate' | 'hover' | 'both';
  idleAnimationSpeed?: number;

  visibilityMode?: 'visible' | 'hidden'; // For 3D models toggling
}

interface EditorState {
  elements: SceneElement[];
  selectedId: string | null;
  targetImageUrl: string | null;
  previewAnimationData: { targetId: string, animationName: string } | null;
  isSnapping: boolean;
  
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
  setSelectedId: (id: string | null) => void;
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
}

export const useEditorStore = create<EditorState>((set, get) => ({
  elements: [],
  selectedId: null,
  targetImageUrl: null,
  previewAnimationData: null,
  isSnapping: true,
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

  setElements: (elements) => set({ elements }),
  
  setTargetImageUrl: (url) => set({ targetImageUrl: url }),
  setPreviewAnimationData: (data) => set({ previewAnimationData: data }),
  
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

  updateElement: (id, updates) => set((state) => ({
    past: [...state.past, state.elements],
    future: [],
    elements: state.elements.map((el) => 
      el.id === id ? { ...el, ...updates } : el
    )
  })),

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

  setSelectedId: (id) => set({ selectedId: id }),
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

  triggerCameraReset: () => set((state) => ({ cameraResetTrigger: state.cameraResetTrigger + 1 }))
}));
