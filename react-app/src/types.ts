export type TaskType = "browser" | "program";

export type Task = {
  type: TaskType;
  title?: string;
  value: string;
  delay: number;
};

export interface ElectronAPI {
  runTasks: (tasks: Task[]) => Promise<void>;
  runSingleTask: (task: Task) => Promise<void>;
  stopTasks: () => Promise<void>;
  saveConfig: (tasks: Task[]) => Promise<void>;
  loadConfig: () => Promise<Task[]>;
  selectFile: () => Promise<string | null>;
  getAutoStart: () => Promise<boolean>;
  setAutoStart: (val: boolean) => Promise<void>;
  isAutoStart: () => Promise<boolean>;
  notifyDirtyState: (tasks: Task[], dirty: boolean) => void;
  onTaskError: (
    callback: (data: { task: Task; message: string }) => void
  ) => () => void;
  onTaskStarted: (
    callback: (data: { task: Task; index: number; total: number }) => void
  ) => () => void;
  onRunFinished: (callback: () => void) => () => void;
}