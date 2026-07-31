import { useEffect } from 'react';
import { useEditorStore } from '@/lib/store';

export interface ShortcutOptions {
  setTransformMode: (mode: 'translate' | 'rotate' | 'scale') => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  openLibrary: () => void;
}

export function useEditorShortcuts({ setTransformMode, toggleLeftPanel, toggleRightPanel, openLibrary }: ShortcutOptions) {
  const selectedId = useEditorStore(state => state.selectedId);
  const setSelectedId = useEditorStore(state => state.setSelectedId);
  const multiSelectedIds = useEditorStore(state => state.multiSelectedIds);
  const setMultiSelectedIds = useEditorStore(state => state.setMultiSelectedIds);
  const elements = useEditorStore(state => state.elements);
  const updateElement = useEditorStore(state => state.updateElement);
  const removeElement = useEditorStore(state => state.removeElement);
  const duplicateElement = useEditorStore(state => state.duplicateElement);
  const groupSelectedElements = useEditorStore(state => state.groupSelectedElements);
  const undo = useEditorStore(state => state.undo);
  const redo = useEditorStore(state => state.redo);
  const isOrthographic = useEditorStore(state => state.isOrthographic);
  const setIsOrthographic = useEditorStore(state => state.setIsOrthographic);
  const setCameraFocusTarget = useEditorStore(state => state.setCameraFocusTarget);
  const setAxisLock = useEditorStore(state => state.setAxisLock);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      
      switch (e.key.toLowerCase()) {
        case 'w': setTransformMode('translate'); break;
        case 'e': setTransformMode('rotate'); break;
        case 'r': setTransformMode('rotate'); break; // R for rotate in Blender
        case 's': setTransformMode('scale'); break; // S for scale in Blender
        
        // Axis Locks (Blender style: press X, Y, Z to lock axis during transform)
        case 'x':
          if (e.shiftKey) { /* Inverse lock not supported natively by TransformControls easily yet */ }
          else if (!['Delete', 'Backspace'].includes(e.key)) {
            setAxisLock('x');
          }
          break;
        case 'y':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            redo();
          } else {
            setAxisLock('y');
          }
          break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
          } else {
            setAxisLock('z');
          }
          break;

        case 'n':
          toggleRightPanel();
          break;
        case 't':
          toggleLeftPanel();
          break;
        case ',':
        case '`':
          const state = useEditorStore.getState();
          state.setTransformSpace(state.transformSpace === 'world' ? 'local' : 'world');
          break;
          
        case 'a':
          if (e.shiftKey) {
            e.preventDefault();
            openLibrary(); // Shift+A to Add object (Blender style)
          } else if (e.altKey) {
            setSelectedId(null);
            setMultiSelectedIds([]);
          } else {
             const allIds = elements.map(el => el.id);
             setMultiSelectedIds(allIds);
          }
          break;

        case 'delete':
        case 'backspace':
          if (selectedId) removeElement(selectedId);
          break;

        case 'g':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            groupSelectedElements();
          } else {
            setTransformMode('translate'); // G for grab in Blender
          }
          break;

        case 'd':
          if (e.shiftKey && selectedId) {
            e.preventDefault();
            duplicateElement(selectedId);
          }
          break;

        case '5':
          setIsOrthographic(!isOrthographic);
          break;

        case '1':
          // Front View
          setCameraFocusTarget([0, 0, 0]); // Temporary logic for numpad view change
          break;
        case '3':
          // Right View
          break;
        case '7':
          // Top View
          break;

        case 'escape': 
          setSelectedId(null); 
          setMultiSelectedIds([]);
          setAxisLock(null); // Clear axis lock
          break;

        case 'h':
          if (e.altKey) {
             elements.forEach(el => updateElement(el.id, { isHidden: false }));
          } else if (selectedId) {
             const el = elements.find(el => el.id === selectedId);
             if (el) updateElement(selectedId, { isHidden: !el.isHidden });
          }
          break;
        case 'f':
        case '.':
          if (selectedId) {
            const el = elements.find(el => el.id === selectedId);
            if (el && el.position) {
              setCameraFocusTarget(el.position as [number, number, number]);
            }
          }
          break;
      }
    };
    
    // Clear axis lock on key up (Optional: depending on how Blender handles it. Usually Blender locks it until click. 
    // We'll let it be toggle or cleared by escape)

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, multiSelectedIds, removeElement, undo, redo, setSelectedId, groupSelectedElements, elements, duplicateElement, isOrthographic, setIsOrthographic, updateElement, setCameraFocusTarget, setTransformMode, setAxisLock, toggleLeftPanel, toggleRightPanel, openLibrary]);
}
