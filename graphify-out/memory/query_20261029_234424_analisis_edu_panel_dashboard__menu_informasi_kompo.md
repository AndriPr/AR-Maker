---
type: "query"
date: "2026-10-29T23:44:24.263661+00:00"
question: "Analisis Edu Panel Dashboard: menu informasi komponen, maintenance dengan jenis/prosedur/animasi editor atau Blender, informasi general, dan tampil saat tes kamera HP AR."
contributor: "graphify"
outcome: "useful"
source_nodes: ["EduComponent", "EduMaintenanceTask", "EduMaintenanceStep", "SubMeshAnimation", "SceneElement", "RightPanel.tsx", "ARUserInterface.tsx", "ARViewer()"]
---

# Q: Analisis Edu Panel Dashboard: menu informasi komponen, maintenance dengan jenis/prosedur/animasi editor atau Blender, informasi general, dan tampil saat tes kamera HP AR.

## Answer

Expanded from original query via graph vocab: [edu, panel, dashboard, maintenance, task, step, animation, component, camera, viewer, route, model]. Desired architecture: component information; maintenance type to ordered procedure steps with Blender clips or editor keyframes/submesh motion; and separate general information. Existing types cover EduComponent, EduMaintenanceTask/EduMaintenanceStep and SubMeshAnimation, and the public MindAR route carries them to phone runtime. Verified gaps: EduComponent lacks detail fields; general info is ambiguous data.description; no per-step Blender selector; SubMeshAnimation targetElementId starts empty; Rekam Awal/Akhir buttons have no handlers; editor simulator selects only modules[0].

## Outcome

- Signal: useful

## Source Nodes

- EduComponent
- EduMaintenanceTask
- EduMaintenanceStep
- SubMeshAnimation
- SceneElement
- RightPanel.tsx
- ARUserInterface.tsx
- ARViewer()