"use client";

import { useEffect } from 'react';
import { useEditorStore } from '@/lib/store';

export function TimelinePlayer() {
  const timelinePlaying = useEditorStore(state => state.timelinePlaying);
  const setTimelineTime = useEditorStore(state => state.setTimelineTime);
  const setTimelinePlaying = useEditorStore(state => state.setTimelinePlaying);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const state = useEditorStore.getState();
      if (!state.timelinePlaying) return;

      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const direction = state.playbackDirection || 1;
      const range = state.playbackRange;
      const prev = state.timelineTime;
      const nextTime = prev + (delta * direction);

      if (range) {
        if (direction === 1 && nextTime >= range[1]) {
           setTimelineTime(range[1]);
           setTimelinePlaying(false);
           return;
        } else if (direction === -1 && nextTime <= range[0]) {
           setTimelineTime(range[0]);
           setTimelinePlaying(false);
           return;
        }
      } else {
        const duration = 10;
        if (direction === 1 && nextTime >= duration) {
          if (state.timelineLooping) {
            setTimelineTime(0);
            animationFrameId = requestAnimationFrame(loop);
            return;
          } else {
            setTimelineTime(duration);
            setTimelinePlaying(false);
            return;
          }
        } else if (direction === -1 && nextTime <= 0) {
          setTimelineTime(0);
          setTimelinePlaying(false);
          return;
        }
      }

      setTimelineTime(nextTime);
      animationFrameId = requestAnimationFrame(loop);
    };

    if (timelinePlaying) {
      lastTime = performance.now();
      animationFrameId = requestAnimationFrame(loop);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [timelinePlaying, setTimelineTime, setTimelinePlaying]);

  return null;
}
