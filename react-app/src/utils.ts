import type { Task } from "./types";

export type DelayUnit = "sec" | "min";

export function formatDelay(delaySeconds: number): string {
  if (delaySeconds > 0 && delaySeconds % 60 === 0) {
    return `${delaySeconds / 60}분`;
  }
  return `${delaySeconds}초`;
}

export function secondsToDisplay(delaySeconds: number, unit: DelayUnit): number {
  return unit === "min" ? delaySeconds / 60 : delaySeconds;
}

export function displayToSeconds(value: number, unit: DelayUnit): number {
  return unit === "min" ? Math.round(value * 60) : value;
}

export function reorderTasks(tasks: Task[], from: number, to: number): Task[] {
  const copy = [...tasks];
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);
  return copy;
}
