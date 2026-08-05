# Graph Report - .  (2026-08-05)

## Corpus Check
- 111 files · ~73,101 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 470 nodes · 1316 edges · 70 communities (29 shown, 41 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.67)
- Token cost: 336,798 input · 0 output

## Community Hubs (Navigation)
- Auth Login/Register Pages
- Shared UI Components
- 3D Element Renderers
- TypeScript Config
- ESLint Dependencies
- shadcn Component Aliases
- Editor Page & Modals
- Editor Header & Panels
- Left Toolbar & Store
- Project Onboarding Docs
- Root Layout & Providers
- Left Panel & Shape Preview
- Logic Editor Node Types
- AR Simulator UI
- 3D/UI Package Deps
- Workspace Members API
- AR Canvas & VPS
- Right Panel Properties
- Supabase Session Middleware
- Workspaces GET API
- Invitations POST API
- Workspace Provision API
- Invitation Respond API
- Next.js Starter Icons
- script.js Utility
- Vercel Starter Asset
- @base-ui/react Dependency
- Supabase Check Script
- clsx Dependency
- ESLint Flat Config
- framer-motion Dependency
- gltf-transform Core Dep
- gltf-transform Functions Dep
- Hook Form Resolvers Dep
- lucide-react Dependency
- meshoptimizer Dependency
- MultiSet VPS Dependency
- Next.js Dependency
- Next.js Config
- next-themes Dependency
- QR Code Dependency
- react-dom Dependency
- react-hook-form Dependency
- React Three Fiber Dep
- R3F Postprocessing Dep
- recharts Dependency
- shadcn Dependency
- sonner Toast Dependency
- Supabase SSR Dependency
- Supabase JS Dependency
- tailwind-merge Dependency
- React Query Dependency
- three.js Dependency
- tw-animate-css Dependency
- XYFlow Dependency
- zod Dependency
- zustand Dependency
- PostCSS Config
- Next.js Wordmark Icon
- PLN Brand Logo

## God Nodes (most connected - your core abstractions)
1. `useEditorStore` - 68 edges
2. `cn()` - 33 edges
3. `useTransformLogic()` - 32 edges
4. `useWorkspace()` - 25 edges
5. `useActionHandler()` - 25 edges
6. `useLogicEngine()` - 25 edges
7. `HotspotElement()` - 24 edges
8. `ModelElement()` - 24 edges
9. `UIButtonElement()` - 24 edges
10. `AudioElement()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `ARCanvas()` --calls--> `useEditorStore`  [EXTRACTED]
  app/ar-canvas/[id]/page.tsx → lib/store.ts
- `PropertiesPanel()` --calls--> `useEditorStore`  [EXTRACTED]
  components/Editor/LogicEditor.tsx → lib/store.ts
- `EditorCanvas()` --calls--> `useEditorStore`  [EXTRACTED]
  components/Editor/LogicEditor.tsx → lib/store.ts
- `Next.js Breaking Changes Notice` --conceptually_related_to--> `Next.js Project (create-next-app bootstrap)`  [AMBIGUOUS]
  AGENTS.md → README.md
- `AnalyticsPage()` --calls--> `useWorkspace()`  [EXTRACTED]
  app/(dashboard)/analytics/page.tsx → components/providers/WorkspaceProvider.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Agent Onboarding Instruction Chain** — claude_agents_reference, agents_nextjs_breaking_changes_notice, agents_node_modules_next_dist_docs [EXTRACTED 1.00]
- **Font Optimization Stack (next/font, Geist, Vercel)** — readme_next_font, readme_geist_font, readme_vercel [EXTRACTED 1.00]
- **Next.js Deployment Flow via Vercel** — readme_nextjs_project, readme_vercel, readme_nextjs_deployment_docs [INFERRED 0.75]

## Communities (70 total, 41 thin omitted)

### Community 0 - "Auth Login/Register Pages"
Cohesion: 0.08
Nodes (27): LoginFormValues, loginSchema, RegisterFormValues, registerSchema, AnalyticsPage(), AssetLibraryPage(), MOCK_MARKET_ASSETS, Dashboard() (+19 more)

### Community 1 - "Shared UI Components"
Cohesion: 0.08
Nodes (35): RenameDialog(), RenameDialogProps, Button(), buttonVariants, ConfirmDialog(), ConfirmDialogProps, DataTableProps, Dialog() (+27 more)

### Community 2 - "3D Element Renderers"
Cohesion: 0.61
Nodes (23): AnimatedElementWrapper(), AudioElement(), CameraController(), GroupFolderElement(), viewportElementRefs, HotspotElement(), ImageElement(), isLogicalObject() (+15 more)

### Community 3 - "TypeScript Config"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 4 - "ESLint Dependencies"
Cohesion: 0.08
Nodes (25): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+17 more)

### Community 5 - "shadcn Component Aliases"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 6 - "Editor Page & Modals"
Cohesion: 0.16
Nodes (11): AREditor(), EditorViewport, PreviewModal(), PreviewModalProps, PublishModal(), PublishModalProps, WebcamTestModal(), WebcamTestModalProps (+3 more)

### Community 7 - "Editor Header & Panels"
Cohesion: 0.21
Nodes (10): EditorHeader(), EditorHeaderProps, EditorViewport(), SubMeshAnimator(), GraphEditorPanel(), TimelinePanel(), TimelineScrubber(), TimelineTimeDisplay() (+2 more)

### Community 8 - "Left Toolbar & Store"
Cohesion: 0.15
Nodes (13): LeftToolbar(), LeftToolbarProps, ActionType, EditorState, EduComponent, EduCustomTrigger, EduMaintenanceStep, EduMaintenanceTask (+5 more)

### Community 9 - "Project Onboarding Docs"
Cohesion: 0.15
Nodes (14): Next.js Breaking Changes Notice, node_modules/next/dist/docs Guide, CLAUDE.md Import of AGENTS.md, app/page.tsx, create-next-app CLI, Development Server (npm/yarn/pnpm/bun dev), Geist Font Family, Learn Next.js Tutorial (+6 more)

### Community 10 - "Root Layout & Providers"
Cohesion: 0.19
Nodes (8): geistMono, geistSans, metadata, viewport, ReactQueryProvider(), WorkspaceProvider(), ThemeProvider(), Toaster()

### Community 11 - "Left Panel & Shape Preview"
Cohesion: 0.22
Nodes (7): SimulatorReveal(), LeftPanelExpanded(), LeftPanelExpandedProps, ShapePreview(), DataTable(), react, react

### Community 12 - "Logic Editor Node Types"
Cohesion: 0.20
Nodes (4): EditorCanvas(), LogicEditor(), nodeTypes, PropertiesPanel()

### Community 13 - "AR Simulator UI"
Cohesion: 0.27
Nodes (7): EditorViewport, SimulatorModal(), SimulatorModalProps, ARUserInterface(), DeviceFrame(), DeviceFrameProps, DeviceType

### Community 14 - "3D/UI Package Deps"
Cohesion: 0.22
Nodes (9): class-variance-authority, dependencies, class-variance-authority, @react-three/drei, @react-three/xr, @tanstack/react-table, @react-three/drei, @react-three/xr (+1 more)

### Community 18 - "Supabase Session Middleware"
Cohesion: 0.60
Nodes (3): config, proxy(), updateSession()

### Community 23 - "Next.js Starter Icons"
Cohesion: 0.50
Nodes (4): create-next-app Default Starter Icon Set, File Icon (public/file.svg), Globe Icon (globe.svg), window.svg (App Window Icon)

### Community 24 - "script.js Utility"
Cohesion: 0.50
Nodes (3): content, fs, shapesMatch

### Community 25 - "Vercel Starter Asset"
Cohesion: 0.67
Nodes (3): create-next-app Default Starter Assets, Vercel Logo (public/vercel.svg), Vercel Triangle Icon (brand mark)

## Ambiguous Edges - Review These
- `Next.js Breaking Changes Notice` → `Next.js Project (create-next-app bootstrap)`  [AMBIGUOUS]
  AGENTS.md · relation: conceptually_related_to

## Knowledge Gaps
- **165 isolated node(s):** `loginSchema`, `LoginFormValues`, `registerSchema`, `RegisterFormValues`, `MOCK_MARKET_ASSETS` (+160 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **41 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Next.js Breaking Changes Notice` and `Next.js Project (create-next-app bootstrap)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `dependencies` connect `3D/UI Package Deps` to `ESLint Dependencies`, `Left Panel & Shape Preview`, `@base-ui/react Dependency`, `clsx Dependency`, `framer-motion Dependency`, `gltf-transform Core Dep`, `gltf-transform Functions Dep`, `Hook Form Resolvers Dep`, `lucide-react Dependency`, `meshoptimizer Dependency`, `MultiSet VPS Dependency`, `Next.js Dependency`, `next-themes Dependency`, `QR Code Dependency`, `react-dom Dependency`, `react-hook-form Dependency`, `React Three Fiber Dep`, `R3F Postprocessing Dep`, `recharts Dependency`, `shadcn Dependency`, `sonner Toast Dependency`, `Supabase SSR Dependency`, `Supabase JS Dependency`, `tailwind-merge Dependency`, `React Query Dependency`, `three.js Dependency`, `tw-animate-css Dependency`, `XYFlow Dependency`, `zod Dependency`, `zustand Dependency`?**
  _High betweenness centrality (0.237) - this node is a cross-community bridge._
- **Why does `react` connect `Left Panel & Shape Preview` to `3D/UI Package Deps`?**
  _High betweenness centrality (0.210) - this node is a cross-community bridge._
- **Why does `LeftPanelExpanded()` connect `Left Panel & Shape Preview` to `Editor Page & Modals`, `Editor Header & Panels`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **What connects `loginSchema`, `LoginFormValues`, `registerSchema` to the rest of the system?**
  _165 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth Login/Register Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.08313725490196078 - nodes in this community are weakly interconnected._
- **Should `Shared UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.08489795918367347 - nodes in this community are weakly interconnected._