import * as THREE from 'three';

export const viewportElementRefs: Record<string, THREE.Group> = {};

// TransformControls renders its gizmo as a scene-graph sibling of the object it
// controls (see drei's TransformControls), so when the controlled object lives
// inside a group_folder, the gizmo's raycast ancestor chain skips the object's
// own onClick and bubbles straight to the folder's. That produces a synthetic
// "click" on mouse-up after a drag which re-selects the parent folder. Flag set
// by useTransformLogic right when a drag ends; consumed once by handleElementClick.
export const transformDragState = { suppressNextClick: false };
