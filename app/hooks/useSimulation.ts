"use client";

import { useEffect, useRef, useState } from "react";
import {
  resetSimulation,
  tick,
  type SimState,
} from "../lib/simulation";

export type SimulationController = {
  state: SimState | null;
  running: boolean;
  speedMultiplier: number;
  start: () => void;
  stop: () => void;
  reset: () => void;
  setSpeedMultiplier: (value: number) => void;
};

export function useSimulation(
  refreshMs = 200,
): SimulationController {
  const safeRefreshMs = Math.max(
    100,
    refreshMs,
  );

  const [state, setState] =
    useState<SimState | null>(null);

  const [running, setRunning] =
    useState(false);

  const [speedMultiplier, setSpeedMultiplierState] =
    useState(1);

  const simTimeRef =
    useRef(0);

  const runningRef =
    useRef(false);

  const speedRef =
    useRef(1);

  const lastWallRef =
    useRef<number | null>(null);

  useEffect(() => {
    resetSimulation();

    simTimeRef.current = 0;
    runningRef.current = false;
    speedRef.current = 1;
    lastWallRef.current =
      performance.now();

    setRunning(false);
    setSpeedMultiplierState(1);
    setState(tick(0));

    const update = () => {
      const now = performance.now();

      const previous =
        lastWallRef.current ?? now;

      const deltaSeconds =
        (now - previous) / 1000;

      lastWallRef.current = now;

      if (!runningRef.current) {
        return;
      }

      simTimeRef.current +=
        deltaSeconds *
        speedRef.current;

      setState(
        tick(simTimeRef.current),
      );
    };

    const timer =
      window.setInterval(
        update,
        safeRefreshMs,
      );

    return () => {
      window.clearInterval(timer);
    };
  }, [safeRefreshMs]);

  const start = () => {
    runningRef.current = true;

    lastWallRef.current =
      performance.now();

    setRunning(true);
  };

  const stop = () => {
    runningRef.current = false;

    lastWallRef.current =
      performance.now();

    setRunning(false);
  };

  const reset = () => {
    resetSimulation();

    simTimeRef.current = 0;
    runningRef.current = false;
    speedRef.current = 1;

    lastWallRef.current =
      performance.now();

    setRunning(false);
    setSpeedMultiplierState(1);
    setState(tick(0));
  };

  const setSpeedMultiplier = (
    value: number,
  ) => {
    const next = Math.max(
      0.25,
      Math.min(8, value),
    );

    speedRef.current = next;
    setSpeedMultiplierState(next);
  };

  return {
    state,
    running,
    speedMultiplier,
    start,
    stop,
    reset,
    setSpeedMultiplier,
  };
}