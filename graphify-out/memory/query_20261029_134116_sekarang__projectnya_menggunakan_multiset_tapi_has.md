---
type: "query"
date: "2026-10-29T13:41:16.890878+00:00"
question: "Sekarang, projectnya menggunakan multiset tapi hasilnya buruk kan ya? sekiranya kamu punya ide ga yang bagus? mungkin seperti yang lebih bagus dari WEBXR, analisis dulu"
contributor: "graphify"
outcome: "useful"
source_nodes: ["ARViewer()", "VPSManager()", "@multisetai/vps", "ar-canvas/[id]/page.tsx"]
---

# Q: Sekarang, projectnya menggunakan multiset tapi hasilnya buruk kan ya? sekiranya kamu punya ide ga yang bagus? mungkin seperti yang lebih bagus dari WEBXR, analisis dulu

## Answer

Expanded from original query via graph vocab: [multisetai, camera, webcam, target, scene, three, fiber, sensor, viewer]. Analisis menemukan runtime publish selalu diarahkan dari ARViewer ke ARCanvas, sementara jalur MindAR masih ada tetapi tidak terpakai. ARCanvas selalu menginisialisasi MultiSet dalam mode object-tracking; pilihan trackingMode di editor tidak disimpan ke scene_data dan tidak dibaca runtime. SDK terpasang menyatakan iOS tidak didukung, tetapi kode mencoba mengakali WebXR Viewer dengan monkey patch global. autoTracking hanya mendeteksi sekali saat session dimulai, sehingga UX scanning mudah gagal. Rekomendasi: pertahankan editor web dan pisahkan runtime per use case; gunakan Unity + Vuforia Model/Area Targets untuk industrial object/area tracking, Unity AR Foundation untuk native plane/image/anchor features, Immersal untuk indoor VPS, dan Zappar Universal AR sebagai web fallback lintas iOS/Android. Jangan memilih 8th Wall karena platform access telah berakhir. Credential MultiSet yang ada di client/hardcoded perlu segera dirotasi dan dibatasi domain.

## Outcome

- Signal: useful

## Source Nodes

- ARViewer()
- VPSManager()
- @multisetai/vps
- ar-canvas/[id]/page.tsx