import { create } from 'zustand';

export type ElementType = '3d_model' | '3d_text' | 'image' | 'video';

export interface SceneElement {
  id: string;
  type: ElementType;
  name: string;
  url?: string;         // For models, images, videos
  content?: string;     // For text
  color?: string;       // For text
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

interface EditorState {
  elements: SceneElement[];
  selectedId: string | null;
  targetImageUrl: string | null;
  
  // Actions
  setElements: (elements: SceneElement[]) => void;
  setTargetImageUrl: (url: string | null) => void;
  addElement: (element: Omit<SceneElement, 'id'>) => void;
  updateElement: (id: string, updates: Partial<SceneElement>) => void;
  removeElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  setSelectedId: (id: string | null) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  elements: [],
  selectedId: null,
  targetImageUrl: null,

  setElements: (elements) => set({ elements }),
  
  setTargetImageUrl: (url) => set({ targetImageUrl: url }),
  
  addElement: (element) => set((state) => {
    const newId = crypto.randomUUID();
    return {
      elements: [...state.elements, { ...element, id: newId }],
      selectedId: newId // auto-select newly added element
    };
  }),

  updateElement: (id, updates) => set((state) => ({
    elements: state.elements.map((el) => 
      el.id === id ? { ...el, ...updates } : el
    )
  })),

  removeElement: (id) => set((state) => ({
    elements: state.elements.filter((el) => el.id !== id),
    selectedId: state.selectedId === id ? null : state.selectedId
  })),

  duplicateElement: (id) => set((state) => {
    const elToDuplicate = state.elements.find((el) => el.id === id);
    if (!elToDuplicate) return state;
    
    const newId = crypto.randomUUID();
    const duplicatedElement = {
      ...elToDuplicate,
      id: newId,
      name: `${elToDuplicate.name} (Copy)`,
      position: [
        elToDuplicate.position[0] + 0.5,
        elToDuplicate.position[1] - 0.5,
        elToDuplicate.position[2]
      ] as [number, number, number]
    };
    
    return {
      elements: [...state.elements, duplicatedElement],
      selectedId: newId
    };
  }),

  setSelectedId: (id) => set({ selectedId: id }),
}));
