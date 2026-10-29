---
type: "query"
date: "2026-10-29T14:04:44.096980+00:00"
question: "jangan pake unity deh, maksudnya tetep ingin di website gitu loh, MindAR apakah yang terbaik? apakah ada yang lebih baik? jika memang sudah yang terbaik maka kamu bersihin dulu yang lama, pastiin ga ada bug lagi, terus abis tu pasang Mind AR, lakukan proses terbaik yang kamu punya"
contributor: "graphify"
outcome: "useful"
source_nodes: ["@multisetai/vps", "ARViewer()", "VPSManager()", "ar-canvas/[id]/page.tsx", "TargetImage", "PublishModal", "WebcamTestModal"]
---

# Q: jangan pake unity deh, maksudnya tetep ingin di website gitu loh, MindAR apakah yang terbaik? apakah ada yang lebih baik? jika memang sudah yang terbaik maka kamu bersihin dulu yang lama, pastiin ga ada bug lagi, terus abis tu pasang Mind AR, lakukan proses terbaik yang kamu punya

## Answer

Expanded from original query via vocab: [camera, image, target, viewer, web, route, publish]. The graph showed the legacy MultiSet/WebXR runtime centered on ar-canvas, ARViewer, target-image handling, and publishing. Implemented a full web-only migration: removed MultiSet and react-three/xr, deleted ar-canvas, redirected ARViewer to a secure standalone MindAR route, aligned compiler/runtime on MindAR 1.2.5, fixed tracking filters and publish failure handling, and verified a Next.js 16.4.3 production build plus public-route behavior.

## Outcome

- Signal: useful

## Source Nodes

- @multisetai/vps
- ARViewer()
- VPSManager()
- ar-canvas/[id]/page.tsx
- TargetImage
- PublishModal
- WebcamTestModal