---
type: "query"
date: "2026-10-29T14:29:49.838539+00:00"
question: "perbaiki ini"
contributor: "graphify"
outcome: "useful"
source_nodes: ["build", "Vercel", "package.json", "EditorViewport.tsx", "devDependencies", "scripts"]
---

# Q: perbaiki ini

## Answer

Expanded from original query via vocab: [canvas, compiler, package, build, deployment, vercel, script, editor]. The Vercel failure was caused by the npm mind-ar package pulling native canvas, whose Node 24 binary was unavailable and whose source build required pixman. Replaced the editor dynamic npm import with a pinned browser ES-module script from jsDelivr, removed mind-ar and its type declaration from the package graph, removed the legacy ar-canvas MultiSet route, and verified Next.js production build, an empty mind-ar/canvas dependency tree, and zero production audit vulnerabilities.

## Outcome

- Signal: useful

## Source Nodes

- build
- Vercel
- package.json
- EditorViewport.tsx
- devDependencies
- scripts