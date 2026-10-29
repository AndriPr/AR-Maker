import type {
  EduAnimationSource,
  EduGeneralInfo,
  EduMaintenanceStep,
  SceneElement,
} from '@/lib/store';

export function resolveEduAnimationSource(
  step: Pick<EduMaintenanceStep, 'animationSource' | 'actionTargetId' | 'actionAnimation' | 'animations'>
): EduAnimationSource {
  if (step.animationSource) return step.animationSource;
  if (step.actionTargetId && step.actionAnimation) return 'blender';
  if (step.animations?.length) return 'submesh';
  return 'none';
}

export function getEduGeneralInfo(panel?: SceneElement | null): EduGeneralInfo {
  return {
    title: panel?.eduGeneralInfo?.title || panel?.panelTitle || panel?.name || 'Informasi General',
    description: panel?.eduGeneralInfo?.description || panel?.data?.description || '',
  };
}

export function getElementAnimationDuration(element?: SceneElement | null): number {
  if (!element?.keyframes?.length) return 0;
  return Math.max(0, ...element.keyframes.map((keyframe) => Number(keyframe.time) || 0));
}
