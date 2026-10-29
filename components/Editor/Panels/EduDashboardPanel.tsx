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
  Plus,
  Trash2,
  Wrench,
} from 'lucide-react';
import type {
  EduAnimationSource,
  EduComponent,
  EduMaintenanceTask,
  SceneElement,
  SubMeshAnimation,
  TransformKeyframe,
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

const inputClass = 'w-full bg-[#0f1013] border border-[#2b2d31] rounded p-2 text-xs text-white outline-none focus:border-pln-blue';
const smallInputClass = 'w-full bg-[#0f1013] border border-[#2b2d31] rounded px-1.5 py-1 text-[10px] text-white outline-none focus:border-pln-blue';

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
          defaultFrame(2, [startPosition[0], startPosition[1] + 0.3, startPosition[2]]),
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
        <p className="mt-1 text-[10px] text-gray-500 leading-relaxed">
          Konten di bawah ini dipakai bersama oleh simulator editor dan kamera HP MindAR.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] text-gray-400 font-medium">Judul Panel</label>
        <input
          value={panel.panelTitle || ''}
          onChange={(event) => updateElement(panel.id, { panelTitle: event.target.value })}
          className={inputClass}
          placeholder="Contoh: EDUKASI SMARTPHONE"
        />
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#111318] p-1 border border-[#2b2d31]">
        {([
          ['components', Cpu, 'Komponen'],
          ['maintenance', Wrench, 'Maintenance'],
          ['general', Info, 'General'],
        ] as const).map(([value, Icon, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setSection(value)}
            className={`flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[9px] font-bold transition-colors ${section === value ? 'bg-pln-blue text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Icon size={14} />
            <span className="truncate max-w-full">{label}</span>
          </button>
        ))}
      </div>

      {section === 'general' && (
        <div className="space-y-3 rounded-xl border border-[#2b2d31] bg-[#17191e] p-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white"><Info size={14} className="text-pln-blue" /> Informasi General</div>
          <input
            value={general.title}
            onChange={(event) => updateElement(panel.id, {
              eduGeneralInfo: { ...general, title: event.target.value },
            })}
            className={inputClass}
            placeholder="Judul informasi umum"
          />
          <textarea
            value={general.description}
            onChange={(event) => updateElement(panel.id, {
              eduGeneralInfo: { ...general, description: event.target.value },
              data: { ...panel.data, description: event.target.value },
            })}
            className={`${inputClass} min-h-28 resize-y`}
            placeholder="Jelaskan fungsi umum, spesifikasi, konteks, atau pengetahuan dasar tentang objek."
          />
        </div>
      )}

      {section === 'components' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5"><ListChecks size={13} /> Informasi Komponen</h5>
              <p className="text-[9px] text-gray-600 mt-0.5">Buat kartu fungsi setiap bagian model.</p>
            </div>
            <button
              type="button"
              onClick={() => saveComponents([...(panel.eduComponents || []), { id: crypto.randomUUID(), name: 'Komponen Baru', description: '' }])}
              className="rounded border border-pln-blue/30 bg-pln-blue/15 px-2 py-1 text-[9px] font-bold text-pln-blue flex items-center gap-1"
            ><Plus size={10} /> Tambah</button>
          </div>

          {!(panel.eduComponents || []).length && <div className="rounded-lg border border-dashed border-[#343741] p-4 text-center text-[10px] text-gray-500">Belum ada informasi komponen.</div>}
          {(panel.eduComponents || []).map((component, index) => {
            const target = elements.find((element) => element.id === component.actionTargetId);
            return (
              <div key={component.id} className="space-y-2 rounded-xl border border-[#2b2d31] bg-[#17191e] p-3">
                <div className="flex items-center gap-2">
                  <Box size={13} className="shrink-0 text-pln-blue" />
                  <input value={component.name} onChange={(event) => updateComponent(index, { name: event.target.value })} className={smallInputClass} placeholder="Nama komponen" />
                  <button type="button" onClick={() => saveComponents((panel.eduComponents || []).filter((item) => item.id !== component.id))} className="text-red-400"><Trash2 size={12} /></button>
                </div>
                <textarea value={component.description || ''} onChange={(event) => updateComponent(index, { description: event.target.value })} className={`${smallInputClass} min-h-16 resize-y`} placeholder="Fungsi dan penjelasan komponen..." />
                <select value={component.actionTargetId || ''} onChange={(event) => updateComponent(index, { actionTargetId: event.target.value || undefined, actionAnimation: undefined })} className={smallInputClass}>
                  <option value="">— Hubungkan ke model (opsional) —</option>
                  {models.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
                </select>
                {target?.availableAnimations?.length ? (
                  <select value={component.actionAnimation || ''} onChange={(event) => updateComponent(index, { actionAnimation: event.target.value || undefined })} className={smallInputClass}>
                    <option value="">Tanpa animasi saat dibuka</option>
                    <option value="*">Semua clip Blender</option>
                    {target.availableAnimations.map((animation) => <option key={animation} value={animation}>{animation}</option>)}
                  </select>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {section === 'maintenance' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5"><Wrench size={13} /> Jenis Maintenance</h5>
              <p className="text-[9px] text-gray-600 mt-0.5">Setiap jenis berisi prosedur langkah demi langkah.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const id = crypto.randomUUID();
                saveTasks([...(panel.eduMaintenanceTasks || []), { id, title: 'Maintenance Baru', description: '', steps: [] }]);
                setOpenTaskId(id);
              }}
              className="rounded border border-pln-yellow/30 bg-pln-yellow/15 px-2 py-1 text-[9px] font-bold text-pln-yellow flex items-center gap-1"
            ><Plus size={10} /> Tambah</button>
          </div>

          {!(panel.eduMaintenanceTasks || []).length && <div className="rounded-lg border border-dashed border-[#343741] p-4 text-center text-[10px] text-gray-500">Belum ada jenis maintenance.</div>}
          {(panel.eduMaintenanceTasks || []).map((task, taskIndex) => {
            const isOpen = openTaskId === task.id;
            return (
              <div key={task.id} className="overflow-hidden rounded-xl border border-[#2b2d31] bg-[#17191e]">
                <div className="flex items-center gap-2 p-2.5">
                  <button type="button" onClick={() => setOpenTaskId(isOpen ? null : task.id)} className="text-pln-yellow">{isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
                  <input value={task.title} onChange={(event) => updateTask(taskIndex, { title: event.target.value })} className={`${smallInputClass} font-bold text-pln-yellow`} placeholder="Contoh: Ganti Baterai" />
                  <button type="button" onClick={() => saveTasks((panel.eduMaintenanceTasks || []).filter((item) => item.id !== task.id))} className="text-red-400"><Trash2 size={12} /></button>
                </div>

                {isOpen && (
                  <div className="space-y-3 border-t border-[#2b2d31] p-3">
                    <textarea value={task.description || ''} onChange={(event) => updateTask(taskIndex, { description: event.target.value })} className={`${smallInputClass} min-h-14 resize-y`} placeholder="Ringkasan maintenance dan kapan perlu dilakukan..." />

                    {task.steps.map((step, stepIndex) => {
                      const source = resolveEduAnimationSource(step);
                      const target = elements.find((element) => element.id === step.actionTargetId);
                      return (
                        <div key={step.id} className="space-y-2 rounded-lg border border-[#30333c] bg-[#101216] p-2.5">
                          <div className="flex items-center gap-2">
                            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-pln-yellow/15 text-[9px] font-bold text-pln-yellow">{stepIndex + 1}</span>
                            <input value={step.title} onChange={(event) => updateStep(taskIndex, stepIndex, { title: event.target.value })} className={`${smallInputClass} font-bold`} placeholder="Judul langkah" />
                            <button type="button" onClick={() => updateTask(taskIndex, { steps: task.steps.filter((item) => item.id !== step.id).map((item, index) => ({ ...item, stepNumber: index + 1 })) })} className="text-red-400"><Trash2 size={11} /></button>
                          </div>
                          <textarea value={step.instruction} onChange={(event) => updateStep(taskIndex, stepIndex, { instruction: event.target.value })} className={`${smallInputClass} min-h-16 resize-y`} placeholder="Instruksi prosedur langkah ini..." />
                          <input value={step.voiceoverUrl || ''} onChange={(event) => updateStep(taskIndex, stepIndex, { voiceoverUrl: event.target.value || undefined })} className={smallInputClass} placeholder="URL narasi audio (opsional)" />

                          <div className="space-y-1.5 rounded-lg border border-[#292c34] bg-[#17191e] p-2">
                            <label className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400"><Film size={11} /> Sumber Animasi</label>
                            <select value={source} onChange={(event) => setStepSource(taskIndex, stepIndex, event.target.value as EduAnimationSource)} className={smallInputClass}>
                              <option value="none">Tanpa animasi</option>
                              <option value="blender">Clip dari Blender / GLB</option>
                              <option value="editor">Animasi Timeline Editor</option>
                              <option value="submesh">Animasi Part / Sub-mesh</option>
                            </select>

                            {source === 'blender' && (
                              <div className="grid gap-1.5">
                                <select value={step.actionTargetId || ''} onChange={(event) => updateStep(taskIndex, stepIndex, { actionTargetId: event.target.value || undefined, actionAnimation: undefined })} className={smallInputClass}>
                                  <option value="">— Pilih model GLB —</option>
                                  {models.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
                                </select>
                                <select value={step.actionAnimation || ''} onChange={(event) => updateStep(taskIndex, stepIndex, { actionAnimation: event.target.value || undefined })} className={smallInputClass} disabled={!target}>
                                  <option value="">— Pilih clip Blender —</option>
                                  <option value="*">Semua clip</option>
                                  {(target?.availableAnimations || []).map((animation) => <option key={animation} value={animation}>{animation}</option>)}
                                </select>
                              </div>
                            )}

                            {source === 'editor' && (
                              <div className="space-y-1.5">
                                <select value={step.actionTargetId || ''} onChange={(event) => updateStep(taskIndex, stepIndex, { actionTargetId: event.target.value || undefined })} className={smallInputClass}>
                                  <option value="">— Pilih objek timeline —</option>
                                  {timelineTargets.map((element) => <option key={element.id} value={element.id}>{element.name}</option>)}
                                </select>
                                <button
                                  type="button"
                                  disabled={!step.actionTargetId}
                                  onClick={() => {
                                    setSelectedId(step.actionTargetId || null);
                                    setShowTimeline(true);
                                  }}
                                  className="w-full rounded bg-purple-500/15 px-2 py-1.5 text-[9px] font-bold text-purple-300 disabled:opacity-40"
                                >Buka Timeline dan Buat Keyframe</button>
                                <p className="text-[8px] leading-relaxed text-gray-600">Keyframe objek dari awal sampai akhir akan dijalankan saat langkah ini dibuka.</p>
                              </div>
                            )}

                            {source === 'submesh' && (
                              <div className="space-y-2">
                                {(step.animations || []).map((animation, animationIndex) => {
                                  const model = models.find((item) => item.id === animation.targetElementId);
                                  const frames = animation.keyframes.length >= 2 ? animation.keyframes : [defaultFrame(0), defaultFrame(2)];
                                  return (
                                    <div key={`${animation.targetElementId}-${animationIndex}`} className="space-y-2 rounded border border-[#343741] p-2">
                                      <div className="flex gap-1">
                                        <select value={animation.targetElementId} onChange={(event) => updateSubMeshAnimation(taskIndex, stepIndex, animationIndex, { targetElementId: event.target.value, targetSubMeshName: elements.find((item) => item.id === event.target.value)?.availableSubMeshes?.[0]?.name || '' })} className={smallInputClass}>
                                          <option value="">— Model —</option>
                                          {models.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                                        </select>
                                        <button type="button" onClick={() => updateStep(taskIndex, stepIndex, { animations: step.animations.filter((_, index) => index !== animationIndex) })} className="text-red-400"><Trash2 size={11} /></button>
                                      </div>
                                      <select value={animation.targetSubMeshName} onChange={(event) => updateSubMeshAnimation(taskIndex, stepIndex, animationIndex, { targetSubMeshName: event.target.value })} className={smallInputClass} disabled={!model}>
                                        <option value="">— Pilih part model —</option>
                                        {(model?.availableSubMeshes || []).map((mesh) => <option key={mesh.name} value={mesh.name}>{mesh.name}</option>)}
                                      </select>
                                      {[0, 1].map((frameIndex) => (
                                        <div key={frameIndex} className="space-y-1.5 rounded bg-[#0d0f13] p-2">
                                          <div className="text-[9px] font-bold text-gray-300">{frameIndex === 0 ? 'Transform Awal' : 'Transform Akhir'}</div>
                                          <VectorEditor label="Posisi" value={frames[frameIndex].position} onChange={(value) => updateSubMeshFrame(taskIndex, stepIndex, animationIndex, frameIndex, { position: value })} />
                                          <VectorEditor label="Rotasi (radian)" value={frames[frameIndex].rotation} onChange={(value) => updateSubMeshFrame(taskIndex, stepIndex, animationIndex, frameIndex, { rotation: value })} />
                                          <VectorEditor label="Skala" value={frames[frameIndex].scale} onChange={(value) => updateSubMeshFrame(taskIndex, stepIndex, animationIndex, frameIndex, { scale: value })} />
                                        </div>
                                      ))}
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
                                      animations: [...(step.animations || []), {
                                        targetElementId: model?.id || '',
                                        targetSubMeshName: mesh?.name || '',
                                        keyframes: [defaultFrame(0, [...position] as [number, number, number]), defaultFrame(2, [position[0], position[1] + 0.3, position[2]])],
                                      }],
                                    });
                                  }}
                                  className="w-full rounded border border-dashed border-[#3b3f49] py-1.5 text-[9px] text-gray-400 hover:text-white"
                                ><Plus size={10} className="inline mr-1" /> Tambah Part</button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => updateTask(taskIndex, {
                        steps: [...task.steps, {
                          id: crypto.randomUUID(),
                          stepNumber: task.steps.length + 1,
                          title: 'Langkah Baru',
                          instruction: '',
                          animations: [],
                          animationSource: 'none',
                        }],
                      })}
                      className="w-full rounded-lg border border-dashed border-[#3b3f49] py-2 text-[9px] font-bold text-gray-400 hover:text-white"
                    ><Plus size={10} className="inline mr-1" /> Tambah Langkah Prosedur</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-2 text-[9px] leading-relaxed text-blue-200/70 flex gap-2">
        <CircleHelp size={12} className="mt-0.5 shrink-0" />
        Publish ulang setelah mengubah konten agar menu yang sama muncul pada kamera HP.
      </div>
    </div>
  );
}
