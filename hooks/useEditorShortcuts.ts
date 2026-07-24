import { useEffect } from 'react';
import { useEditorStore } from '@/lib/store';

export function useEditorShortcuts(setTransformMode: (mode: 'translate' | 'rotate' | 'scale') => void) {
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
        case 'escape': 
          setSelectedId(null); 
          setMultiSelectedIds([]);
          break;
        case 'x':
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
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
          }
          break;
        case 'y':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            redo();
          }
          break;
        case 'a':
          if (e.altKey) {
            setSelectedId(null);
            setMultiSelectedIds([]);
          } else {
             const allIds = elements.map(el => el.id);
             setMultiSelectedIds(allIds);
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
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, multiSelectedIds, removeElement, undo, redo, setSelectedId, groupSelectedElements, elements, duplicateElement, isOrthographic, setIsOrthographic, updateElement, setCameraFocusTarget, setTransformMode]);
}
