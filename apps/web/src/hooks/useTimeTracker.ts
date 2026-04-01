'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

export interface TimeTrackerState {
  elapsedTime: number; // in milliseconds
  isRunning: boolean;
  startTime: number | null;
}

/**
 * useTimeTracker Hook
 * 
 * Manages an execution timer for field tasks.
 * Includes localStorage persistence to survive browser refreshes.
 */
export function useTimeTracker(taskId?: string) {
  const storageKey = `validiant_timer_${taskId}`;

  const [state, setState] = useState<TimeTrackerState>(() => {
    if (typeof window === 'undefined' || !taskId) {
      return { elapsedTime: 0, isRunning: false, startTime: null };
    }

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      // If it was running, calculate elapsed since last start
      if (parsed.isRunning && parsed.startTime) {
        const extra = Date.now() - parsed.startTime;
        return {
          elapsedTime: parsed.elapsedTime + extra,
          isRunning: true,
          startTime: Date.now(),
        };
      }
      return parsed;
    }
    return { elapsedTime: 0, isRunning: false, startTime: null };
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const saveToStorage = useCallback((newState: TimeTrackerState) => {
    if (taskId) {
      localStorage.setItem(storageKey, JSON.stringify(newState));
    }
  }, [taskId, storageKey]);

  const start = useCallback(() => {
    if (state.isRunning) return;
    
    logger.info('[TimeTracker:AutoPunch]', { action: 'START', taskId });
    const newState = {
      ...state,
      isRunning: true,
      startTime: Date.now(),
    };
    setState(newState);
    saveToStorage(newState);
  }, [state, taskId, saveToStorage]);

  const pause = useCallback(() => {
    if (!state.isRunning) return;

    logger.info('[TimeTracker:AutoPunch]', { action: 'PAUSE', taskId });
    const now = Date.now();
    const sessionIdDuration = state.startTime ? now - state.startTime : 0;
    const newState = {
      elapsedTime: state.elapsedTime + sessionIdDuration,
      isRunning: false,
      startTime: null,
    };
    setState(newState);
    saveToStorage(newState);
  }, [state, taskId, saveToStorage]);

  const reset = useCallback(() => {
    logger.info('[TimeTracker:AutoPunch]', { action: 'RESET', taskId });
    const newState = { elapsedTime: 0, isRunning: false, startTime: null };
    setState(newState);
    if (taskId) localStorage.removeItem(storageKey);
  }, [taskId, storageKey]);

  const stop = useCallback(() => {
    const finalTime = state.elapsedTime + (state.startTime ? Date.now() - state.startTime : 0);
    logger.info('[TimeTracker:FinalDuration]', { taskId, durationMs: finalTime });
    pause();
    return finalTime;
  }, [state, taskId, pause]);

  // Tick logic
  useEffect(() => {
    if (state.isRunning) {
      timerRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          // We don't update state.elapsedTime here to avoid constant storage writes
          // instead we calculate it on the fly in the UI or on stop/pause
        }));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.isRunning]);

  // Derived current elapsed time
  const currentElapsed = state.isRunning && state.startTime
    ? state.elapsedTime + (Date.now() - state.startTime)
    : state.elapsedTime;

  return {
    elapsedTime: currentElapsed,
    isRunning: state.isRunning,
    start,
    pause,
    reset,
    stop,
  };
}
