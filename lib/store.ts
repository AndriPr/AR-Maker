import { create } from 'zustand';

export type ElementType = '3d_model' | '3d_text' | 'image' | 'video' | 'ui_button' | 'edu_panel' | 'audio' | 'vfx_sparkles' | 'hotspot';

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

export interface SceneElement {
  id: string;
  type: ElementType;
  name: string;
  url?: string;         // For models, images, videos
  content?: string;     // For text
  color?: string;       // For text
  
  // Interactivity Properties
  availableAnimations?: string[]; // Extracted from 3D model GLTF
  buttonText?: string;            // For UI button
  actionTargetId?: string;        // The ID of the model to animate
  actionAnimation?: string;       // The name of the animation to play
  
  // No-Code On-Click Actions (For any element)
  onClickActionType?: 'none' | 'url' | 'audio' | 'animation';
  onClickActionValue?: string; // URL, Audio Element ID, or Animation Name
  
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

  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  
  visibilityMode?: 'visible' | 'hidden'; // For 3D models toggling
}

interface EditorState {
  elements: SceneElement[];
  selectedId: string | null;
  targetImageUrl: string | null;
  previewAnimationData: { targetId: string, animationName: string } | null;
  isSnapping: boolean;
  
  // Environment
  ambientLightIntensity: number;
  directionalLightIntensity: number;
  environmentMap: 'none' | 'studio' | 'city' | 'sunset' | 'forest' | 'apartment';
  
  // History
  past: SceneElement[][];
  future: SceneElement[][];

  // Actions
  setElements: (elements: SceneElement[]) => void;
  setTargetImageUrl: (url: string | null) => void;
  setPreviewAnimationData: (data: { targetId: string, animationName: string } | null) => void;
  addElement: (element: Omit<SceneElement, 'id'>) => void;
  updateElement: (id: string, updates: Partial<SceneElement>) => void;
  removeElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  setSelectedId: (id: string | null) => void;
  setIsSnapping: (val: boolean) => void;
  setAmbientLightIntensity: (val: number) => void;
  setDirectionalLightIntensity: (val: number) => void;
  setEnvironmentMap: (map: 'none' | 'studio' | 'city' | 'sunset' | 'forest' | 'apartment') => void;
  undo: () => void;
  redo: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  elements: [],
  selectedId: null,
  targetImageUrl: null,
  previewAnimationData: null,
  isSnapping: true,
  ambientLightIntensity: 0.8,
  directionalLightIntensity: 1.8,
  environmentMap: 'none',
  past: [],
  future: [],

  setElements: (elements) => set({ elements }), // Initialization doesn't clear history directly here, let caller decide.
  
  setTargetImageUrl: (url) => set({ targetImageUrl: url }),
  setPreviewAnimationData: (data) => set({ previewAnimationData: data }),
  
  addElement: (element) => set((state) => {
    const newId = crypto.randomUUID();
    return {
      past: [...state.past, state.elements],
      future: [],
      elements: [...state.elements, { ...element, id: newId }],
      selectedId: newId
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
    const el = state.elements.find((e) => e.id === id);
    if (!el) return state;
    const newId = crypto.randomUUID();
    const newEl = { ...el, id: newId, name: `${el.name} (Copy)`, position: [el.position[0] + 0.5, el.position[1], el.position[2] + 0.5] as [number, number, number] };
    return {
      past: [...state.past, state.elements],
      future: [],
      elements: [...state.elements, newEl],
      selectedId: newId
    };
  }),

  setSelectedId: (id) => set({ selectedId: id }),
  setIsSnapping: (val) => set({ isSnapping: val }),
  setAmbientLightIntensity: (val) => set({ ambientLightIntensity: val }),
  setDirectionalLightIntensity: (val) => set({ directionalLightIntensity: val }),
  setEnvironmentMap: (map) => set({ environmentMap: map }),

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
  })
}));
