"use client";

import React from 'react';
import {
  BookOpen,
  Box,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Cpu,
  Film,
  Info,
  ListChecks,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Volume2,
  Wrench,
} from 'lucide-react';
import {
  useEditorStore,
  type EduAnimationSource,
  type EduComponent,
  type EduMaintenanceTask,
  type SceneElement,
  type SubMeshAnimation,
  type TransformKeyframe,
} from '@/lib/store';
import { getEduGeneralInfo, resolveEduAnimationSource } from '@/lib/education';

interface EduDashboardPanelProps {
  panel: SceneElement;
  elements: SceneElement[];
  updateElement: (id: string, patch: Partial<SceneElement>) => void;
  setSelectedId: (id: string | null) => void;
  setShowTimeline: (show: boolean) => void;
}

type Section = 'components' | 'maintenance' | 'general';

const inputClass = 'w-full bg-[#0f1013] border border-[#2b2d31] rounded p-2 text-xs text-white outline-none focus:border-pln-blue transition-colors';
const smallInputClass = 'w-full bg-[#0f1013] border border-[#2b2d31] rounded px-2 py-1.5 text-[10px] text-white outline-none focus:border-pln-blue transition-colors';

function cloneTasks(tasks: EduMaintenanceTask[]): EduMaintenanceTask[] {
  return tasks.map((task) => ({
    ...task,
    steps: task.steps.map((step) => ({
      ...step,
      animations: (step.animations || []).map((animation) => ({
        ...animation,
        keyframes: animation.keyframes.map((keyframe) => ({ ...keyframe })),
      })),
    })),
  }));
}

function defaultFrame(time: number, position: [number, number, number] = [0, 0, 0]): TransformKeyframe {
  return {
    time,
    position,
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    easing: 'easeInOutQuad',
  };
}

function VectorEditor({
  label,
  value,
  onChange,
  step = 0.1,
}: {
  label: string;
  value: [number, number, number];
  onChange: (value: [number, number, number]) => void;
  step?: number;
}) {
  return (
    <div className="space-y-1">
      <span className="text-[8px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
      <div className="grid grid-cols-3 gap-1">
        {value.map((part, index) => (
          <input
            key={index}
            type="number"
            step={step}
            value={Number(part).toString()}
            onChange={(event) => {
              const next = [...value] as [number, number, number];
              next[index] = Number(event.target.value) || 0;
              onChange(next);
            }}
            className={smallInputClass}
            aria-label={`${label} ${['X', 'Y', 'Z'][index]}`}
          />
        ))}
      </div>
    </div>
  );
}

export function EduDashboardPanel({
  panel,
  elements,
  updateElement,
  setSelectedId,
  setShowTimeline,
}: EduDashboardPanelProps) {
  const [section, setSection] = React.useState<Section>('components');
  const [openTaskId, setOpenTaskId] = React.useState<string | null>(panel.eduMaintenanceTasks?.[0]?.id || null);
  const models = elements.filter((element) => element.type === '3d_model');
  const timelineTargets = elements.filter((element) => ['3d_model', '3d_shape', 'group_folder'].includes(element.type));
  const general = getEduGeneralInfo(panel);

  const saveComponents = (components: EduComponent[]) => updateElement(panel.id, { eduComponents: components });
  const saveTasks = (tasks: EduMaintenanceTask[]) => updateElement(panel.id, { eduMaintenanceTasks: tasks });

  const testAnimation = (targetId?: string, animationName?: string) => {
    if (!targetId || !animationName) return;
    const targetModel = elements.find((e) => e.id === targetId);
    const resolvedName = animationName === '*' ? (targetModel?.availableAnimations?.[0] || '') : animationName;
    if (resolvedName) {
      useEditorStore.getState().setPreviewAnimationData({ targetId, animationName: resolvedName });
    }
  };

  const testAudio = (url?: string) => {
    if (!url) return;
    try {
      const audio = new Audio(url);
      audio.play().catch((e) => console.warn('Could not test audio:', e));
    } catch (err) {
      console.warn('Audio play error', err);
    }
  };

  const updateComponent = (index: number, patch: Partial<EduComponent>) => {
    const next = (panel.eduComponents || []).map((component, componentIndex) => (
      componentIndex === index ? { ...component, ...patch } : component
    ));
    saveComponents(next);
  };

  const updateTask = (taskIndex: number, patch: Partial<EduMaintenanceTask>) => {
    const next = cloneTasks(panel.eduMaintenanceTasks || []);
    next[taskIndex] = { ...next[taskIndex], ...patch };
    saveTasks(next);
  };

  const updateStep = (taskIndex: number, stepIndex: number, patch: Record<string, unknown>) => {
    const next = cloneTasks(panel.eduMaintenanceTasks || []);
    next[taskIndex].steps[stepIndex] = { ...next[taskIndex].steps[stepIndex], ...patch };
    saveTasks(next);
  };

  const updateSubMeshAnimation = (
    taskIndex: number,
    stepIndex: number,
    animationIndex: number,
    patch: Partial<SubMeshAnimation>
  ) => {
    const next = cloneTasks(panel.eduMaintenanceTasks || []);
    const animation = next[taskIndex].steps[stepIndex].animations[animationIndex];
    next[taskIndex].steps[stepIndex].animations[animationIndex] = { ...animation, ...patch };
    saveTasks(next);
  };

  const updateSubMeshFrame = (
    taskIndex: number,
    stepIndex: number,
    animationIndex: number,
    frameIndex: number,
    patch: Partial<TransformKeyframe>
  ) => {
    const next = cloneTasks(panel.eduMaintenanceTasks || []);
    const frame = next[taskIndex].steps[stepIndex].animations[animationIndex].keyframes[frameIndex];
    next[taskIndex].steps[stepIndex].animations[animationIndex].keyframes[frameIndex] = { ...frame, ...patch };
    saveTasks(next);
  };

  const applySubMeshPreset = (
    taskIndex: number,
    stepIndex: number,
    animationIndex: number,
    axis: 0 | 1 | 2,
    delta: number
  ) => {
    const next = cloneTasks(panel.eduMaintenanceTasks || []);
    const animation = next[taskIndex].steps[stepIndex].animations[animationIndex];
    if (!animation.keyframes || animation.keyframes.length < 2) return;
    const startPos = animation.keyframes[0].position || [0, 0, 0];
    const nextPos: [number, number, number] = [...startPos];
    nextPos[axis] += delta;
    animation.keyframes[1].position = nextPos;
    saveTasks(next);
  };

  const setStepSource = (taskIndex: number, stepIndex: number, source: EduAnimationSource) => {
    const step = panel.eduMaintenanceTasks?.[taskIndex]?.steps?.[stepIndex];
    const patch: Record<string, unknown> = { animationSource: source };
    if (source !== 'blender') patch.actionAnimation = undefined;
    if (source === 'none') patch.actionTargetId = undefined;
    if (source === 'submesh' && !step?.animations?.length) {
      const model = models[0];
      const subMesh = model?.availableSubMeshes?.[0];
      const startPosition = subMesh?.position || [0, 0, 0];
      patch.animations = [{
        targetElementId: model?.id || '',
        targetSubMeshName: subMesh?.name || '',
        keyframes: [
          defaultFrame(0, [...startPosition] as [number, number, number]),
          defaultFrame(2, [startPosition[0], startPosition[1] + 0.35, startPosition[2]]),
        ],
      }];
    }
    updateStep(taskIndex, stepIndex, patch);
  };

  return (
    <div className="space-y-4 pt-4 border-t border-[#2b2d31]">
      <div>
        <h4 className="text-xs font-bold text-pln-yellow uppercase flex items-center gap-2">
          <BookOpen size={14} /> Edu Panel Dashboard
        </h4>
        <p className="mt-1 text-[10px] text-gray-400 leading-relaxed">
          Konten edukasi terstruktur (Komponen, Maintenance, General) untuk simulator PC dan WebAR HP.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] text-gray-400 font-medium">Judul Panel Utama</label>
        <input
          value={panel.panelTitle || ''}
          onChange={(event) => updateElement(panel.id, { panelTitle: event.target.value })}
          className={inputClass}
          placeholder="Contoh: Edukasi Perangkat Smartphone"
        />
      </div>

      {/* 3 Menu Tabs (A. Komponen, B. Maintenance, C. General) */}
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#111318] p-1 border border-[#2b2d31]">
        {([
          ['components', Cpu, 'A. Komponen'],
          ['maintenance', Wrench, 'B. Maintenance'],
          ['general', Info, 'C. General'],
        ] as const).map(([value, Icon, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setSection(value)}
            className={`flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[9px] font-bold transition-all ${
              section === value
                ? 'bg-pln-blue text-white shadow-sm'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon size={14} />
            <span className="truncate max-w-full">{label}</span>
          </button>
        ))}
      </div>

      {/* SECTION A: INFORMASI KOMPONEN */}
      {section === 'components' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <ListChecks size={13} /> A. Informasi Komponen
              </h5>
              <p className="text-[9px] text-gray-400 mt-0.5">Daftar komponen (misal: Baterai, Kamera, Processor) dan fungsinya.</p>
            </div>
            <button
              type="button"
              onClick={() => saveComponents([
                ...(panel.eduComponents || []),
                { id: crypto.randomUUID(), name: 'Komponen Baru', description: '' }
              ])}
              className="rounded-lg border border-cyan-500/30 bg-cyan-500/15 px-2.5 py-1 text-[9px] font-bold text-cyan-300 flex items-center gap-1 hover:bg-cyan-500/25 transition-colors"
            >
              <Plus size={10} /> Tambah
            </button>
          </div>

          {!(panel.eduComponents || []).length && (
            <div className="rounded-xl border border-dashed border-[#343741] p-5 text-center text-[10px] text-gray-500">
              Belum ada komponen. Klik tombol <strong>+ Tambah</strong> di atas untuk membuat informasi komponen baru (seperti Baterai, Kamera, Processor).
            </div>
          )}

          {(panel.eduComponents || []).map((component, index) => {
            const target = elements.find((element) => element.id === component.actionTargetId);
            return (
              <div key={component.id} className="space-y-2.5 rounded-xl border border-[#2b2d31] bg-[#17191e] p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Box size={14} className="shrink-0 text-cyan-400" />
                  <input
                    value={component.name}
                    onChange={(event) => updateComponent(index, { name: event.target.value })}
                    className={`${smallInputClass} font-bold text-white`}
                    placeholder="Nama komponen (contoh: Baterai Lithium)"
                  />
                  <button
                    type="button"
                    title="Hapus komponen"
                    onClick={() => saveComponents((panel.eduComponents || []).filter((item) => item.id !== component.id))}
                    className="text-red-400/80 hover:text-red-400 p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div>
                  <label className="text-[9px] text-gray-400 block mb-1">Fungsi & Penjelasan Detail Komponen:</label>
                  <textarea
                    value={component.description || ''}
                    onChange={(event) => updateComponent(index, { description: event.target.value })}
                    className={`${smallInputClass} min-h-16 resize-y leading-relaxed`}
                    placeholder="Jelaskan peran fungsi komponen ini di dalam sistem/perangkat..."
                  />
                </div>

                <div className="grid gap-1.5 pt-1 border-t border-[#252830]">
                  <label className="text-[8.5px] uppercase font-bold text-gray-400">Interaksi 3D saat Komponen Dipilih:</label>
                  <select
                    value={component.actionTargetId || ''}
                    onChange={(event) => updateComponent(index, { actionTargetId: event.target.value || undefined, actionAnimation: undefined })}
                    className={smallInputClass}
                  >
                    <option value="">— Hubungkan ke model 3D (opsional) —</option>
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                  </select>

                  {target?.availableAnimations?.length ? (
                    <div className="flex gap-1.5">
                      <select
                        value={component.actionAnimation || ''}
                        onChange={(event) => updateComponent(index, { actionAnimation: event.target.value || undefined })}
                        className={`${smallInputClass} flex-1`}
                      >
                        <option value="">Tanpa animasi saat dibuka</option>
                        <option value="*">Putar semua clip Blender</option>
                        {target.availableAnimations.map((animation) => (
                          <option key={animation} value={animation}>{animation}</option>
                        ))}
                      </select>
                      {component.actionAnimation && (
                        <button
                          type="button"
                          onClick={() => testAnimation(component.actionTargetId, component.actionAnimation)}
                          title="Test animasi di viewport"
                          className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded hover:bg-cyan-500/30 text-[9px] font-bold flex items-center gap-1"
                        >
                          <Play size={10} /> Test
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SECTION B: PROSEDUR MAINTENANCE */}
      {section === 'maintenance' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Wrench size={13} /> B. Prosedur Maintenance
              </h5>
              <p className="text-[9px] text-gray-400 mt-0.5">Modul perawatan bertahap (contoh: Ganti Baterai, Bongkar Kamera).</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const id = crypto.randomUUID();
                saveTasks([
                  ...(panel.eduMaintenanceTasks || []),
                  { id, title: 'Prosedur Baru', description: '', steps: [] }
                ]);
                setOpenTaskId(id);
              }}
              className="rounded-lg border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-[9px] font-bold text-amber-300 flex items-center gap-1 hover:bg-amber-500/25 transition-colors"
            >
              <Plus size={10} /> Tambah Modul
            </button>
          </div>

          {!(panel.eduMaintenanceTasks || []).length && (
            <div className="rounded-xl border border-dashed border-[#343741] p-5 text-center text-[10px] text-gray-500">
              Belum ada modul maintenance. Klik <strong>+ Tambah Modul</strong> untuk membuat prosedur seperti "Ganti Baterai".
            </div>
          )}

          {(panel.eduMaintenanceTasks || []).map((task, taskIndex) => {
            const isOpen = openTaskId === task.id;
            return (
              <div key={task.id} className="overflow-hidden rounded-xl border border-[#2b2d31] bg-[#17191e] shadow-sm">
                <div className="flex items-center gap-2 p-2.5 bg-[#14161b]">
                  <button
                    type="button"
                    onClick={() => setOpenTaskId(isOpen ? null : task.id)}
                    className="text-amber-400 hover:text-amber-300 p-0.5"
                  >
                    {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                  <input
                    value={task.title}
                    onChange={(event) => updateTask(taskIndex, { title: event.target.value })}
                    className={`${smallInputClass} font-bold text-amber-400 flex-1`}
                    placeholder="Judul prosedur (contoh: Ganti Baterai)"
                  />
                  <span className="text-[9px] text-gray-500 font-medium px-1.5 py-0.5 bg-black/30 rounded">
                    {task.steps.length} langkah
                  </span>
                  <button
                    type="button"
                    title="Hapus prosedur ini"
                    onClick={() => saveTasks((panel.eduMaintenanceTasks || []).filter((item) => item.id !== task.id))}
                    className="text-red-400/80 hover:text-red-400 p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {isOpen && (
                  <div className="space-y-3 border-t border-[#2b2d31] p-3">
                    <div>
                      <label className="text-[9px] text-gray-400 block mb-1">Deskripsi Prosedur:</label>
                      <textarea
                        value={task.description || ''}
                        onChange={(event) => updateTask(taskIndex, { description: event.target.value })}
                        className={`${smallInputClass} min-h-14 resize-y leading-relaxed`}
                        placeholder="Ringkasan prosedur perbaikan dan kondisi keselamatan kerja..."
                      />
                    </div>

                    {/* STEPS LIST */}
                    <div className="space-y-2.5 pt-1">
                      <div className="text-[9.5px] font-bold text-gray-300 flex items-center justify-between">
                        <span>Langkah demi Langkah:</span>
                      </div>

                      {task.steps.map((step, stepIndex) => {
                        const source = resolveEduAnimationSource(step);
                        const target = elements.find((element) => element.id === step.actionTargetId);
                        return (
                          <div key={step.id} className="space-y-2 rounded-xl border border-[#30333c] bg-[#101216] p-3">
                            <div className="flex items-center gap-2">
                              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-400/20 text-[9px] font-bold text-amber-400">
                                {stepIndex + 1}
                              </span>
                              <input
                                value={step.title}
                                onChange={(event) => updateStep(taskIndex, stepIndex, { title: event.target.value })}
                                className={`${smallInputClass} font-bold text-white`}
                                placeholder="Judul langkah (contoh: Lepaskan Baut Bawah)"
                              />
                              <button
                                type="button"
                                title="Hapus langkah"
                                onClick={() => updateTask(taskIndex, {
                                  steps: task.steps.filter((item) => item.id !== step.id).map((item, index) => ({ ...item, stepNumber: index + 1 })),
                                })}
                                className="text-red-400/80 hover:text-red-400 p-1"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>

                            <textarea
                              value={step.instruction}
                              onChange={(event) => updateStep(taskIndex, stepIndex, { instruction: event.target.value })}
                              className={`${smallInputClass} min-h-16 resize-y leading-relaxed`}
                              placeholder="Instruksi detail prosedur tindakan pada langkah ini..."
                            />

                            {/* Narasi Audio Voiceover */}
                            <div className="flex items-center gap-1.5">
                              <Volume2 size={13} className="text-gray-400 shrink-0" />
                              <input
                                value={step.voiceoverUrl || ''}
                                onChange={(event) => updateStep(taskIndex, stepIndex, { voiceoverUrl: event.target.value || undefined })}
                                className={`${smallInputClass} flex-1`}
                                placeholder="URL audio panduan suara (opsional)"
                              />
                              {step.voiceoverUrl && (
                                <button
                                  type="button"
                                  onClick={() => testAudio(step.voiceoverUrl)}
                                  className="px-2 py-1 bg-white/10 text-white rounded hover:bg-white/20 text-[9px] font-bold flex items-center gap-1 shrink-0"
                                >
                                  <Play size={10} /> Test Audio
                                </button>
                              )}
                            </div>

                            {/* SUMBER ANIMASI BUILDER */}
                            <div className="space-y-2 rounded-lg border border-[#292c34] bg-[#16181f] p-2.5">
                              <label className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-amber-300">
                                <span className="flex items-center gap-1.5"><Film size={12} /> Sumber Animasi Langkah</span>
                              </label>

                              <select
                                value={source}
                                onChange={(event) => setStepSource(taskIndex, stepIndex, event.target.value as EduAnimationSource)}
                                className={smallInputClass}
                              >
                                <option value="none">Tanpa animasi pada langkah ini</option>
                                <option value="blender">1. Clip Animasi dari Blender / GLB</option>
                                <option value="editor">2. Animasi Timeline Editor</option>
                                <option value="submesh">3. Animasi Part / Sub-mesh (Bongkar/Exploded View)</option>
                              </select>

                              {/* PILIHAN 1: BLENDER CLIP */}
                              {source === 'blender' && (
                                <div className="grid gap-2 pt-1 border-t border-[#252830]">
                                  <select
                                    value={step.actionTargetId || ''}
                                    onChange={(event) => updateStep(taskIndex, stepIndex, { actionTargetId: event.target.value || undefined, actionAnimation: undefined })}
                                    className={smallInputClass}
                                  >
                                    <option value="">— Pilih model GLB —</option>
                                    {models.map((model) => (
                                      <option key={model.id} value={model.id}>{model.name}</option>
                                    ))}
                                  </select>

                                  <div className="flex gap-1.5">
                                    <select
                                      value={step.actionAnimation || ''}
                                      onChange={(event) => updateStep(taskIndex, stepIndex, { actionAnimation: event.target.value || undefined })}
                                      className={`${smallInputClass} flex-1`}
                                      disabled={!target}
                                    >
                                      <option value="">— Pilih clip Blender —</option>
                                      <option value="*">Semua clip</option>
                                      {(target?.availableAnimations || []).map((animation) => (
                                        <option key={animation} value={animation}>{animation}</option>
                                      ))}
                                    </select>
                                    {step.actionAnimation && (
                                      <button
                                        type="button"
                                        onClick={() => testAnimation(step.actionTargetId, step.actionAnimation)}
                                        className="px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded hover:bg-amber-500/30 text-[9px] font-bold flex items-center gap-1 shrink-0"
                                      >
                                        <Play size={10} /> Test
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* PILIHAN 2: TIMELINE EDITOR */}
                              {source === 'editor' && (
                                <div className="space-y-2 pt-1 border-t border-[#252830]">
                                  <select
                                    value={step.actionTargetId || ''}
                                    onChange={(event) => updateStep(taskIndex, stepIndex, { actionTargetId: event.target.value || undefined })}
                                    className={smallInputClass}
                                  >
                                    <option value="">— Pilih objek timeline —</option>
                                    {timelineTargets.map((element) => (
                                      <option key={element.id} value={element.id}>{element.name}</option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    disabled={!step.actionTargetId}
                                    onClick={() => {
                                      setSelectedId(step.actionTargetId || null);
                                      setShowTimeline(true);
                                    }}
                                    className="w-full rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 px-3 py-2 text-[9.5px] font-bold text-purple-200 disabled:opacity-40 transition-colors"
                                  >
                                    Buka Timeline dan Buat Keyframe Objek
                                  </button>
                                  <p className="text-[8.5px] text-gray-500 leading-relaxed">
                                    Keyframe transform objek di timeline akan diputar saat langkah ini aktif di AR.
                                  </p>
                                </div>
                              )}

                              {/* PILIHAN 3: SUB-MESH / PART ANIMATION */}
                              {source === 'submesh' && (
                                <div className="space-y-3 pt-1 border-t border-[#252830]">
                                  {(step.animations || []).map((animation, animationIndex) => {
                                    const model = models.find((item) => item.id === animation.targetElementId);
                                    const frames = animation.keyframes.length >= 2 ? animation.keyframes : [defaultFrame(0), defaultFrame(2)];
                                    return (
                                      <div key={`${animation.targetElementId}-${animationIndex}`} className="space-y-2.5 rounded-lg border border-[#343741] bg-[#12141a] p-2.5">
                                        <div className="flex gap-1.5 items-center">
                                          <select
                                            value={animation.targetElementId}
                                            onChange={(event) => updateSubMeshAnimation(taskIndex, stepIndex, animationIndex, {
                                              targetElementId: event.target.value,
                                              targetSubMeshName: elements.find((item) => item.id === event.target.value)?.availableSubMeshes?.[0]?.name || '',
                                            })}
                                            className={`${smallInputClass} flex-1`}
                                          >
                                            <option value="">— Pilih Model —</option>
                                            {models.map((item) => (
                                              <option key={item.id} value={item.id}>{item.name}</option>
                                            ))}
                                          </select>
                                          <button
                                            type="button"
                                            title="Hapus part ini"
                                            onClick={() => updateStep(taskIndex, stepIndex, {
                                              animations: step.animations.filter((_, idx) => idx !== animationIndex),
                                            })}
                                            className="text-red-400/80 hover:text-red-400 p-1"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>

                                        <select
                                          value={animation.targetSubMeshName}
                                          onChange={(event) => updateSubMeshAnimation(taskIndex, stepIndex, animationIndex, { targetSubMeshName: event.target.value })}
                                          className={smallInputClass}
                                          disabled={!model}
                                        >
                                          <option value="">— Pilih Part / Sub-mesh model —</option>
                                          {(model?.availableSubMeshes || []).map((mesh) => (
                                            <option key={mesh.name} value={mesh.name}>{mesh.name}</option>
                                          ))}
                                        </select>

                                        {/* Transform Awal & Transform Akhir */}
                                        <div className="space-y-2">
                                          <div className="rounded-lg bg-[#0b0c10] border border-[#22252c] p-2 space-y-1.5">
                                            <div className="flex items-center justify-between text-[9px] font-bold text-gray-300">
                                              <span>1. Transform Posisi Awal</span>
                                              {model?.availableSubMeshes?.find((m) => m.name === animation.targetSubMeshName) && (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const mesh = model.availableSubMeshes?.find((m) => m.name === animation.targetSubMeshName);
                                                    if (mesh?.position) {
                                                      updateSubMeshFrame(taskIndex, stepIndex, animationIndex, 0, { position: [...mesh.position] });
                                                    }
                                                  }}
                                                  className="text-[8px] text-cyan-400 hover:underline flex items-center gap-1"
                                                >
                                                  <RotateCcw size={10} /> Reset ke Posisi Asli
                                                </button>
                                              )}
                                            </div>
                                            <VectorEditor
                                              label="Posisi Awal"
                                              value={frames[0].position}
                                              onChange={(val) => updateSubMeshFrame(taskIndex, stepIndex, animationIndex, 0, { position: val })}
                                            />
                                          </div>

                                          <div className="rounded-lg bg-[#0b0c10] border border-[#22252c] p-2 space-y-2">
                                            <div className="flex items-center justify-between text-[9px] font-bold text-amber-300">
                                              <span>2. Transform Posisi Akhir (Bongkar)</span>
                                            </div>
                                            <VectorEditor
                                              label="Posisi Akhir"
                                              value={frames[1].position}
                                              onChange={(val) => updateSubMeshFrame(taskIndex, stepIndex, animationIndex, 1, { position: val })}
                                            />

                                            {/* Quick preset movement buttons */}
                                            <div className="pt-1 border-t border-[#1d2027]">
                                              <span className="text-[8px] font-bold text-gray-400 block mb-1">Preset Gerak Cepat:</span>
                                              <div className="grid grid-cols-4 gap-1">
                                                <button
                                                  type="button"
                                                  onClick={() => applySubMeshPreset(taskIndex, stepIndex, animationIndex, 1, 0.4)}
                                                  className="px-1.5 py-1 bg-white/5 hover:bg-white/10 text-white text-[8px] font-bold rounded"
                                                  title="Angkat ke atas +Y 0.4m"
                                                >
                                                  ⬆ +Y (Atas)
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => applySubMeshPreset(taskIndex, stepIndex, animationIndex, 1, -0.4)}
                                                  className="px-1.5 py-1 bg-white/5 hover:bg-white/10 text-white text-[8px] font-bold rounded"
                                                  title="Geser turun -Y 0.4m"
                                                >
                                                  ⬇ -Y (Bawah)
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => applySubMeshPreset(taskIndex, stepIndex, animationIndex, 0, 0.4)}
                                                  className="px-1.5 py-1 bg-white/5 hover:bg-white/10 text-white text-[8px] font-bold rounded"
                                                  title="Geser samping +X 0.4m"
                                                >
                                                  ➡ +X (Kanan)
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => applySubMeshPreset(taskIndex, stepIndex, animationIndex, 2, 0.4)}
                                                  className="px-1.5 py-1 bg-white/5 hover:bg-white/10 text-white text-[8px] font-bold rounded"
                                                  title="Tarik ke depan +Z 0.4m"
                                                >
                                                  ↗ +Z (Depan)
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const model = models[0];
                                      const mesh = model?.availableSubMeshes?.[0];
                                      const position = mesh?.position || [0, 0, 0];
                                      updateStep(taskIndex, stepIndex, {
                                        animations: [
                                          ...(step.animations || []),
                                          {
                                            targetElementId: model?.id || '',
                                            targetSubMeshName: mesh?.name || '',
                                            keyframes: [
                                              defaultFrame(0, [...position] as [number, number, number]),
                                              defaultFrame(2, [position[0], position[1] + 0.35, position[2]]),
                                            ],
                                          },
                                        ],
                                      });
                                    }}
                                    className="w-full rounded-lg border border-dashed border-[#3b3f49] py-2 text-[9px] text-gray-400 hover:text-white flex items-center justify-center gap-1 transition-colors"
                                  >
                                    <Plus size={11} /> Tambah Part / Sub-mesh
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => updateTask(taskIndex, {
                        steps: [
                          ...task.steps,
                          {
                            id: crypto.randomUUID(),
                            stepNumber: task.steps.length + 1,
                            title: `Langkah ${task.steps.length + 1}`,
                            instruction: '',
                            animations: [],
                            animationSource: 'none',
                          },
                        ],
                      })}
                      className="w-full rounded-xl border border-dashed border-[#3b3f49] py-2.5 text-[9.5px] font-bold text-gray-300 hover:text-white bg-[#14161b] hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus size={12} /> Tambah Langkah Prosedur
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* SECTION C: INFORMASI GENERAL */}
      {section === 'general' && (
        <div className="space-y-3 rounded-xl border border-[#2b2d31] bg-[#17191e] p-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <Info size={15} /> C. Informasi General Perangkat
          </div>
          <p className="text-[9px] text-gray-400">
            Penjelasan umum spesifikasi, sejarah, atau gambaran global perangkat saat penonton membuka menu General di AR.
          </p>

          <div className="space-y-1">
            <label className="text-[9.5px] font-bold text-gray-300">Judul Informasi:</label>
            <input
              value={general.title}
              onChange={(event) => updateElement(panel.id, {
                eduGeneralInfo: { ...general, title: event.target.value },
              })}
              className={inputClass}
              placeholder="Contoh: Spesifikasi & Ikhtisar Perangkat"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9.5px] font-bold text-gray-300">Deskripsi Lengkap:</label>
            <textarea
              value={general.description}
              onChange={(event) => updateElement(panel.id, {
                eduGeneralInfo: { ...general, description: event.target.value },
                data: { ...panel.data, description: event.target.value },
              })}
              className={`${inputClass} min-h-32 resize-y leading-relaxed`}
              placeholder="Jelaskan gambaran umum, fungsi utama perangkat di industri/kehidupan nyata, spesifikasi teknis, atau instruksi keselamatan..."
            />
          </div>
        </div>
      )}

      <div className="rounded-xl border border-blue-500/25 bg-blue-500/10 p-2.5 text-[9px] leading-relaxed text-blue-200/80 flex gap-2">
        <Sparkles size={14} className="mt-0.5 shrink-0 text-blue-400" />
        <span>
          <strong>Tips:</strong> Setelah mengubah konfigurasi di Edu Dashboard, klik <strong>Publish</strong> di header editor agar data terbaru langsung tampil pada saat scan WebAR di HP.
        </span>
      </div>
    </div>
  );
}
