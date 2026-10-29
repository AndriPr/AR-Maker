---
type: "query"
date: "2026-10-29T23:35:35.691178+00:00"
question: "ini kan masih kosong banget nih, bisa ga di-instegrasikan dengan edu-dashboard yang sudah ada? agar sistem edukasi ini bisa memberikan animasi pilihan, informasi yang ada sesuai edu dashboard dan sebagainya"
contributor: "graphify"
outcome: "useful"
source_nodes: ["EduComponent", "EduMaintenanceTask", "EduMaintenanceStep", "SubMeshAnimation", "SceneElement", "ARUserInterface", "ModelElement", "AnimatedElementWrapper"]
---

# Q: ini kan masih kosong banget nih, bisa ga di-instegrasikan dengan edu-dashboard yang sudah ada? agar sistem edukasi ini bisa memberikan animasi pilihan, informasi yang ada sesuai edu dashboard dan sebagainya

## Answer

Expanded from original query via vocab: [edu, dashboard, panel, maintenance, task, step, animation, trigger, viewer, route, scene, model]. Graph traversal showed that EduComponent, EduMaintenanceTask/EduMaintenanceStep, SubMeshAnimation, and EduCustomTrigger are persisted on SceneElement but the public AR route only rendered edu_panel as a static A-Frame plane. Implemented a normalized education payload in app/api/ar/[id]/route.ts and a mobile runtime that exposes Info, Panduan, and Animasi; it binds component actions, GLTF clips, legacy step actions, sub-mesh keyframes, custom trigger timeline animation, object descriptions, scene selection, and voiceover. The edu_panel plane is no longer rendered in marker space. Verified with the real project route: 1 panel, 4 components, 1 four-step module, 1 model; ESLint, node --check, git diff --check, and Next production build passed.

## Outcome

- Signal: useful

## Source Nodes

- EduComponent
- EduMaintenanceTask
- EduMaintenanceStep
- SubMeshAnimation
- SceneElement
- ARUserInterface
- ModelElement
- AnimatedElementWrapper