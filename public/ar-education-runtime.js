(() => {
  'use strict';

  const dataElement = document.getElementById('edu-runtime-data');
  const runtime = document.getElementById('edu-runtime');
  if (!dataElement || !runtime) return;

  let config;
  try {
    config = JSON.parse(dataElement.textContent || '{}');
  } catch (error) {
    console.error('Edu runtime data is invalid', error);
    return;
  }

  if (!Array.isArray(config.panels) || config.panels.length === 0) return;

  const dock = document.getElementById('edu-dock');
  const dockTitle = document.getElementById('edu-dock-title');
  const dockMeta = document.getElementById('edu-dock-meta');
  const backdrop = document.getElementById('edu-backdrop');
  const sheet = document.getElementById('edu-sheet');
  const closeButton = document.getElementById('edu-close');
  const title = document.getElementById('edu-title');
  const tabs = document.getElementById('edu-tabs');
  const content = document.getElementById('edu-content');
  const toast = document.getElementById('edu-toast');
  const scene = document.querySelector('a-scene');
  const entities = new Map(
    Array.from(document.querySelectorAll('[data-element-id]'))
      .map((element) => [element.dataset.elementId, element])
  );
  const modelElements = new Map(
    Array.from(document.querySelectorAll('[data-model-for]'))
      .map((element) => [element.dataset.modelFor, element])
  );
  const objectsById = new Map((config.objects || []).map((object) => [object.id, object]));
  const modelStates = new Map();
  const pendingClips = new Map();

  const state = {
    sceneId: config.initialSceneId,
    tab: 'components',
    moduleIndex: 0,
    stepIndex: 0,
    selectedObjectId: null,
    activeTriggers: new Set(),
    triggerTimes: new Map(),
    stepAnimation: null,
    voiceover: null,
    toastTimer: 0,
    previousFrameTime: performance.now(),
  };

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const currentPanel = () => (
    config.panels.find((panel) => panel.sceneId === state.sceneId) || config.panels[0]
  );
  const currentObjects = () => (
    (config.objects || []).filter((object) => object.sceneId === state.sceneId)
  );
  const currentModule = () => currentPanel()?.modules?.[state.moduleIndex] || null;
  const currentStep = () => currentModule()?.steps?.[state.stepIndex] || null;
  const resolveStepSource = (step) => {
    if (step?.animationSource) return step.animationSource;
    if (step?.actionTargetId && step?.actionAnimation) return 'blender';
    if (step?.animations?.length) return 'submesh';
    return 'none';
  };

  function showToast(message) {
    if (!message) return;
    window.clearTimeout(state.toastTimer);
    toast.textContent = message;
    toast.classList.add('edu-visible');
    state.toastTimer = window.setTimeout(() => toast.classList.remove('edu-visible'), 2200);
  }

  function openSheet(tabName) {
    if (tabName) state.tab = tabName;
    runtime.classList.add('edu-open');
    dock.setAttribute('aria-expanded', 'true');
    sheet.setAttribute('aria-hidden', 'false');
    render();
  }

  function closeSheet() {
    runtime.classList.remove('edu-open');
    dock.setAttribute('aria-expanded', 'false');
    sheet.setAttribute('aria-hidden', 'true');
    dock.focus({ preventScroll: true });
  }

  function setScene(sceneId) {
    if (!sceneId || sceneId === state.sceneId) return;
    document.querySelectorAll('[data-scene-root]').forEach((root) => {
      root.setAttribute('visible', String(root.dataset.sceneRoot === sceneId));
    });
    window.dispatchEvent(new CustomEvent('ar-scene-change', { detail: { sceneId } }));
  }

  function updateScene(sceneId) {
    if (!sceneId) return;
    state.sceneId = sceneId;
    state.moduleIndex = 0;
    state.stepIndex = 0;
    state.selectedObjectId = currentObjects()[0]?.id || null;
    stopVoiceover();
    state.stepAnimation = null;
    render();
  }

  function setVisible(elementId, visible) {
    const entity = entities.get(elementId);
    if (!entity) return false;
    entity.setAttribute('visible', String(Boolean(visible)));
    return true;
  }

  function getThree() {
    return window.AFRAME?.THREE || window.THREE || null;
  }

  function setupModel(elementId, modelElement, event) {
    const Three = getThree();
    const root = event?.detail?.model || modelElement.getObject3D?.('mesh') || modelElement.object3D;
    if (!Three || !root || modelStates.has(elementId)) return;

    const componentModel = modelElement.components?.['gltf-model']?.model;
    const clips = root.animations || componentModel?.animations || [];
    const mixer = new Three.AnimationMixer(root);
    modelStates.set(elementId, { root, mixer, clips, actions: [] });

    const pending = pendingClips.get(elementId);
    if (pending) {
      pendingClips.delete(elementId);
      playClip(elementId, pending.name, pending.silent);
    } else {
      const object = objectsById.get(elementId);
      if (object?.autoplayAnimation) playClip(elementId, object.autoplayAnimation, true);
    }

    if (state.tab === 'maintenance' && currentStep()) startCurrentStep(false);
  }

  function playClip(elementId, animationName, silent = false) {
    const object = objectsById.get(elementId);
    const modelState = modelStates.get(elementId);
    if (!modelState) {
      pendingClips.set(elementId, { name: animationName, silent });
      if (!silent) showToast('Model sedang dimuat. Animasi akan diputar otomatis.');
      return false;
    }

    const Three = getThree();
    if (!Three) return false;
    modelState.actions.forEach((action) => action.stop());
    modelState.actions = [];

    const requested = animationName === '*'
      ? modelState.clips
      : modelState.clips.filter((clip) => clip.name === animationName || clip.name.toLowerCase() === String(animationName).toLowerCase());

    if (requested.length === 0) {
      if (!silent) showToast(`Animasi “${animationName}” tidak ditemukan pada model.`);
      return false;
    }

    requested.forEach((clip) => {
      const action = modelState.mixer.clipAction(clip, modelState.root);
      const loopMode = object?.animationLoopMode || 'loop';
      action.reset();
      action.enabled = true;
      action.clampWhenFinished = loopMode === 'once';
      action.setEffectiveTimeScale(object?.animationSpeed || 1);
      if (loopMode === 'once') action.setLoop(Three.LoopOnce, 1);
      else if (loopMode === 'pingpong') action.setLoop(Three.LoopPingPong, Infinity);
      else action.setLoop(Three.LoopRepeat, Infinity);
      action.play();
      modelState.actions.push(action);
    });

    if (!silent) showToast(animationName === '*' ? 'Semua animasi diputar.' : `Animasi “${animationName}” diputar.`);
    return true;
  }

  function executeComponent(component) {
    let acted = false;
    if (component.actionTargetId && component.actionAnimation) {
      playClip(component.actionTargetId, component.actionAnimation);
      state.selectedObjectId = component.actionTargetId;
      acted = true;
    }
    if (component.showTargetId) {
      acted = setVisible(component.showTargetId, true) || acted;
      state.selectedObjectId = component.showTargetId;
    }
    if (component.hideTargetId) {
      acted = setVisible(component.hideTargetId, false) || acted;
    }
    if (!acted) showToast('Komponen ini belum memiliki aksi dari Edu Dashboard.');
    else render();
  }

  function ease(progress, easing) {
    const p = Math.max(0, Math.min(1, progress));
    if (easing === 'ease-in') return p * p;
    if (easing === 'ease-out') return p * (2 - p);
    if (easing === 'ease-in-out' || easing === 'easeInOutQuad') {
      return p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
    }
    if (easing === 'smoothstep') return p * p * (3 - 2 * p);
    if (easing === 'bounce') {
      const n = 7.5625;
      const d = 2.75;
      let value = p;
      if (value < 1 / d) return n * value * value;
      if (value < 2 / d) return n * (value -= 1.5 / d) * value + 0.75;
      if (value < 2.5 / d) return n * (value -= 2.25 / d) * value + 0.9375;
      return n * (value -= 2.625 / d) * value + 0.984375;
    }
    return p;
  }

  function boundsFor(keyframes, property, time) {
    const frames = keyframes.filter((keyframe) => Array.isArray(keyframe[property]));
    if (frames.length === 0) return null;
    if (time <= frames[0].time) return [frames[0], frames[0], 0];
    const last = frames[frames.length - 1];
    if (time >= last.time) return [last, last, 0];
    for (let index = 0; index < frames.length - 1; index += 1) {
      const first = frames[index];
      const second = frames[index + 1];
      if (time >= first.time && time <= second.time) {
        const raw = second.time > first.time ? (time - first.time) / (second.time - first.time) : 0;
        return [first, second, ease(raw, first.easing || 'linear')];
      }
    }
    return null;
  }

  function sampleTransform(object3D, keyframes, time) {
    if (!object3D || !Array.isArray(keyframes) || keyframes.length === 0) return;
    const Three = getThree();
    const position = boundsFor(keyframes, 'position', time);
    const rotation = boundsFor(keyframes, 'rotation', time);
    const scale = boundsFor(keyframes, 'scale', time);

    if (position) {
      object3D.position.set(
        position[0].position[0] + (position[1].position[0] - position[0].position[0]) * position[2],
        position[0].position[1] + (position[1].position[1] - position[0].position[1]) * position[2],
        position[0].position[2] + (position[1].position[2] - position[0].position[2]) * position[2]
      );
    }
    if (rotation && Three) {
      const start = new Three.Quaternion().setFromEuler(new Three.Euler(...rotation[0].rotation));
      const end = new Three.Quaternion().setFromEuler(new Three.Euler(...rotation[1].rotation));
      object3D.quaternion.slerpQuaternions(start, end, rotation[2]);
    }
    if (scale) {
      object3D.scale.set(
        scale[0].scale[0] + (scale[1].scale[0] - scale[0].scale[0]) * scale[2],
        scale[0].scale[1] + (scale[1].scale[1] - scale[0].scale[1]) * scale[2],
        scale[0].scale[2] + (scale[1].scale[2] - scale[0].scale[2]) * scale[2]
      );
    }
  }

  function maxKeyframeTime(keyframes) {
    return Math.max(0, ...(keyframes || []).map((keyframe) => Number(keyframe.time) || 0));
  }

  function updateTriggers(delta) {
    const triggers = currentPanel()?.triggers || [];
    const targetIds = new Set(triggers.map((trigger) => trigger.targetElementId).filter(Boolean));
    targetIds.forEach((targetId) => {
      const object = objectsById.get(targetId);
      const entity = entities.get(targetId);
      if (!object?.keyframes?.length || !entity?.object3D) return;
      const active = triggers.some((trigger) => trigger.targetElementId === targetId && state.activeTriggers.has(trigger.id));
      const maximum = maxKeyframeTime(object.keyframes);
      const current = state.triggerTimes.get(targetId) || 0;
      const next = active ? Math.min(maximum, current + delta) : Math.max(0, current - delta);
      state.triggerTimes.set(targetId, next);
      sampleTransform(entity.object3D, object.keyframes, next);
    });
  }

  function toggleTrigger(triggerId) {
    const trigger = currentPanel()?.triggers?.find((item) => item.id === triggerId);
    if (!trigger) return;
    if (state.activeTriggers.has(triggerId)) {
      state.activeTriggers.delete(triggerId);
      showToast(`${trigger.label} dimatikan.`);
    } else {
      state.activeTriggers.add(triggerId);
      showToast(`${trigger.label} diaktifkan.`);
    }
    render();
  }

  function subMeshFor(animation) {
    const modelState = modelStates.get(animation.targetElementId);
    return modelState?.root?.getObjectByName?.(animation.targetSubMeshName) || null;
  }

  function applySubMeshFrame(animation, atEnd) {
    const mesh = subMeshFor(animation);
    const keyframes = animation.keyframes || [];
    if (!mesh || keyframes.length === 0) return;
    sampleTransform(mesh, keyframes, atEnd ? maxKeyframeTime(keyframes) : 0);
  }

  function stopVoiceover() {
    if (!state.voiceover) return;
    state.voiceover.pause();
    state.voiceover.currentTime = 0;
    state.voiceover = null;
  }

  function playVoiceover(url) {
    stopVoiceover();
    if (!url) return;
    const audio = new Audio(url);
    state.voiceover = audio;
    audio.play().catch(() => showToast('Audio narasi tidak dapat diputar.'));
  }

  function runStepActions(step, silent) {
    if (resolveStepSource(step) === 'blender' && step.actionTargetId && step.actionAnimation) {
      playClip(step.actionTargetId, step.actionAnimation, silent);
    }
    if (step.showTargetId) setVisible(step.showTargetId, true);
    if (step.hideTargetId) setVisible(step.hideTargetId, false);
  }

  function startCurrentStep(animate = true) {
    const lessonModule = currentModule();
    const step = currentStep();
    if (!lessonModule || !step) return;

    stopVoiceover();
    state.stepAnimation = null;

    lessonModule.steps.forEach((item) => {
      if (resolveStepSource(item) === 'submesh') {
        (item.animations || []).forEach((animation) => applySubMeshFrame(animation, false));
      }
    });
    lessonModule.steps.slice(0, state.stepIndex).forEach((item) => {
      if (resolveStepSource(item) === 'submesh') {
        (item.animations || []).forEach((animation) => applySubMeshFrame(animation, true));
      }
      runStepActions(item, true);
    });

    const source = resolveStepSource(step);
    const tracks = source === 'submesh'
      ? (step.animations || []).flatMap((animation) => {
          const mesh = subMeshFor(animation);
          return mesh && animation.keyframes?.length ? [{ mesh, keyframes: animation.keyframes }] : [];
        })
      : [];
    if (source === 'editor' && step.actionTargetId) {
      const targetObject = objectsById.get(step.actionTargetId);
      const targetEntity = entities.get(step.actionTargetId);
      if (targetObject?.keyframes?.length && targetEntity?.object3D) {
        tracks.push({ mesh: targetEntity.object3D, keyframes: targetObject.keyframes });
      }
    }
    tracks.forEach((track) => sampleTransform(track.mesh, track.keyframes, 0));
    runStepActions(step, false);

    if (animate) {
      state.stepAnimation = { elapsed: 0, duration: 2, tracks };
    } else {
      tracks.forEach((track) => sampleTransform(track.mesh, track.keyframes, maxKeyframeTime(track.keyframes)));
      updateProgress(1);
    }
  }

  function updateProgress(progress) {
    const bar = content.querySelector('[data-step-progress-bar]');
    const label = content.querySelector('[data-step-progress-label]');
    const percentage = Math.round(Math.max(0, Math.min(1, progress)) * 100);
    if (bar) bar.style.width = `${percentage}%`;
    if (label) label.textContent = `${percentage}%`;
  }

  function updateStepAnimation(delta) {
    const animation = state.stepAnimation;
    if (!animation) return;
    animation.elapsed = Math.min(animation.duration, animation.elapsed + delta);
    const progress = animation.duration > 0 ? animation.elapsed / animation.duration : 1;
    animation.tracks.forEach((track) => {
      const time = maxKeyframeTime(track.keyframes) * progress;
      sampleTransform(track.mesh, track.keyframes, time);
    });
    updateProgress(progress);
    if (progress >= 1) state.stepAnimation = null;
  }

  function renderSceneSelector() {
    if (!Array.isArray(config.scenes) || config.scenes.length < 2) return '';
    return `<section class="edu-section">
      <div class="edu-section-head"><h3>Scene</h3><span class="edu-count">${config.scenes.length} pilihan</span></div>
      <div class="edu-card-grid">${config.scenes.map((item) => `
        <button class="edu-card ${item.id === state.sceneId ? 'edu-selected' : ''}" type="button" data-scene-id="${escapeHtml(item.id)}">
          <span class="edu-card-icon">▧</span><span class="edu-card-title">${escapeHtml(item.name)}</span>
          <span class="edu-card-meta">${item.id === state.sceneId ? 'Sedang aktif' : 'Buka scene'}</span>
        </button>`).join('')}</div>
    </section>`;
  }

  function renderComponents() {
    const panel = currentPanel();
    const components = panel?.components || [];
    const triggers = panel?.triggers || [];

    content.innerHTML = `<section class="edu-section">
        <div class="edu-section-head"><h3>Informasi Komponen</h3><span class="edu-count">${components.length} komponen</span></div>
        ${components.length ? `<div class="edu-action-list">${components.map((component, index) => `
          <button class="edu-action-card" type="button" data-component-index="${index}">
            <span class="edu-card-icon">◎</span><span class="edu-action-copy"><strong>${escapeHtml(component.name)}</strong><small>${escapeHtml(component.description || 'Deskripsi komponen belum diisi.')}</small></span>
            <span class="edu-action-badge">${component.actionAnimation || component.showTargetId || component.hideTargetId ? 'Buka' : 'Info'}</span>
          </button>`).join('')}</div>` : '<div class="edu-empty">Belum ada komponen pada Edu Dashboard.</div>'}
      </section>
      ${triggers.length ? `<section class="edu-section"><div class="edu-section-head"><h3>Aksi Interaktif Lama</h3><span class="edu-count">${triggers.length} aksi</span></div><div class="edu-action-list">${triggers.map((trigger) => `
        <button class="edu-action-card ${state.activeTriggers.has(trigger.id) ? 'edu-active' : ''}" type="button" data-trigger-id="${escapeHtml(trigger.id)}"><span class="edu-card-icon">${state.activeTriggers.has(trigger.id) ? '●' : '○'}</span><span class="edu-action-copy"><strong>${escapeHtml(trigger.label)}</strong><small>Animasi timeline kompatibilitas proyek lama</small></span><span class="edu-action-badge">${state.activeTriggers.has(trigger.id) ? 'On' : 'Off'}</span></button>`).join('')}</div></section>` : ''}`;
  }

  function renderGeneral() {
    const panel = currentPanel();
    content.innerHTML = `${renderSceneSelector()}<section class="edu-section"><div class="edu-section-head"><h3>${escapeHtml(panel?.generalTitle || 'Informasi General')}</h3></div><div class="edu-detail"><p>${escapeHtml(panel?.description || 'Informasi general belum diisi pada Edu Dashboard.')}</p></div></section>`;
  }

  function renderMaintenance() {
    const modules = currentPanel()?.modules || [];
    const lessonModule = currentModule();
    const step = currentStep();
    if (!modules.length || !lessonModule?.steps?.length || !step) {
      content.innerHTML = '<div class="edu-empty">Belum ada modul dan langkah edukasi pada scene ini. Tambahkan melalui Edu Dashboard di editor.</div>';
      return;
    }

    const moduleSelect = modules.length > 1 ? `<select class="edu-module-select" data-module-select aria-label="Pilih modul">${modules.map((item, index) => `<option value="${index}" ${index === state.moduleIndex ? 'selected' : ''}>${escapeHtml(item.title)}</option>`).join('')}</select>` : '';
    content.innerHTML = `${moduleSelect}<article class="edu-step">
      <div class="edu-step-top"><div><span class="edu-step-kicker">${escapeHtml(lessonModule.title)}</span><div class="edu-card-title">Langkah ${state.stepIndex + 1} dari ${lessonModule.steps.length}</div></div><span class="edu-step-progress" data-step-progress-label>0%</span></div>
      <div class="edu-progress-track"><div class="edu-progress-bar" data-step-progress-bar style="width:0%"></div></div>
      <div class="edu-step-body">${lessonModule.description ? `<p class="edu-copy" style="margin-bottom:12px">${escapeHtml(lessonModule.description)}</p>` : ''}<h4>${escapeHtml(step.title)}</h4><p>${escapeHtml(step.instruction || 'Ikuti petunjuk visual pada objek AR.')}</p><div style="display:flex;gap:8px;margin-top:12px;"><button class="edu-button" type="button" data-step-replay style="flex:1;">↺ Putar Animasi</button>${step.voiceoverUrl ? '<button class="edu-button edu-voice" type="button" data-voiceover style="flex:1;margin-top:0;">♪ Putar Narasi</button>' : ''}</div></div>
      <div class="edu-step-actions"><button class="edu-button" type="button" data-step-prev ${state.stepIndex === 0 ? 'disabled' : ''}>← Sebelumnya</button><button class="edu-button edu-primary" type="button" data-step-next>${state.stepIndex === lessonModule.steps.length - 1 ? 'Selesai' : 'Berikutnya →'}</button></div>
    </article>`;
  }

  function bindContentEvents() {
    content.querySelectorAll('[data-scene-id]').forEach((button) => button.addEventListener('click', () => setScene(button.dataset.sceneId)));
    content.querySelectorAll('[data-component-index]').forEach((button) => button.addEventListener('click', () => executeComponent(currentPanel().components[Number(button.dataset.componentIndex)])));
    content.querySelectorAll('[data-trigger-id]').forEach((button) => button.addEventListener('click', () => toggleTrigger(button.dataset.triggerId)));

    const moduleSelect = content.querySelector('[data-module-select]');
    moduleSelect?.addEventListener('change', () => {
      state.moduleIndex = Number(moduleSelect.value) || 0;
      state.stepIndex = 0;
      render();
      startCurrentStep(true);
    });
    content.querySelector('[data-step-prev]')?.addEventListener('click', () => {
      state.stepIndex = Math.max(0, state.stepIndex - 1);
      render();
      startCurrentStep(true);
    });
    content.querySelector('[data-step-next]')?.addEventListener('click', () => {
      const lessonModule = currentModule();
      if (state.stepIndex < lessonModule.steps.length - 1) {
        state.stepIndex += 1;
        render();
        startCurrentStep(true);
      } else {
        updateProgress(1);
        showToast('Modul selesai. Bagus!');
      }
    });
    content.querySelector('[data-voiceover]')?.addEventListener('click', () => playVoiceover(currentStep()?.voiceoverUrl));
    content.querySelector('[data-step-replay]')?.addEventListener('click', () => {
      startCurrentStep(true);
      showToast('Memutar ulang animasi langkah...');
    });
  }

  function render() {
    const panel = currentPanel();
    title.textContent = panel?.title || 'Panel Edukasi';
    dockTitle.textContent = panel?.title || 'Panel Edukasi';
    const moduleCount = panel?.modules?.length || 0;
    const objectCount = currentObjects().length;
    dockMeta.textContent = `${objectCount} objek • ${moduleCount} modul • animasi interaktif`;
    tabs.querySelectorAll('[data-edu-tab]').forEach((button) => button.setAttribute('aria-selected', String(button.dataset.eduTab === state.tab)));
    if (state.tab === 'maintenance') renderMaintenance();
    else if (state.tab === 'general') renderGeneral();
    else renderComponents();
    bindContentEvents();
  }

  function tick(time) {
    const delta = Math.min(0.05, Math.max(0, (time - state.previousFrameTime) / 1000));
    state.previousFrameTime = time;
    modelStates.forEach((modelState) => modelState.mixer.update(delta));
    updateTriggers(delta);
    updateStepAnimation(delta);
    requestAnimationFrame(tick);
  }

  dock.addEventListener('click', () => openSheet());
  closeButton.addEventListener('click', closeSheet);
  backdrop.addEventListener('click', closeSheet);
  tabs.addEventListener('click', (event) => {
    const button = event.target.closest('[data-edu-tab]');
    if (!button) return;
    state.tab = button.dataset.eduTab;
    render();
    if (state.tab === 'maintenance') startCurrentStep(true);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && runtime.classList.contains('edu-open')) closeSheet();
  });

  entities.forEach((entity, elementId) => {
    entity.addEventListener('click', () => {
      if (!objectsById.has(elementId)) return;
      state.selectedObjectId = elementId;
      state.tab = 'components';
      openSheet('components');
    });
  });

  modelElements.forEach((modelElement, elementId) => {
    modelElement.addEventListener('model-loaded', (event) => setupModel(elementId, modelElement, event));
    const existing = modelElement.getObject3D?.('mesh');
    if (existing) setupModel(elementId, modelElement, { detail: { model: existing } });
  });

  window.addEventListener('ar-scene-change', (event) => updateScene(event.detail?.sceneId));
  window.addEventListener('ar-play-animation', (event) => playClip(event.detail?.targetId, event.detail?.animationName));
  window.addEventListener('ar-target-found', () => {
    dock.classList.add('edu-dock-pulse');
    setTimeout(() => dock.classList.remove('edu-dock-pulse'), 2000);
    showToast('Marker terdeteksi! Buka panel edukasi di bawah.');
  });
  scene?.addEventListener('arReady', () => {
    runtime.hidden = false;
    render();
  });

  state.selectedObjectId = currentObjects()[0]?.id || null;
  currentPanel().triggers?.forEach((trigger) => {
    const object = objectsById.get(trigger.targetElementId);
    const entity = entities.get(trigger.targetElementId);
    if (object?.keyframes?.length && entity?.object3D) {
      state.triggerTimes.set(trigger.targetElementId, 0);
      sampleTransform(entity.object3D, object.keyframes, 0);
    }
  });
  render();
  requestAnimationFrame(tick);
})();
