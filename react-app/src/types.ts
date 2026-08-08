export type TaskType = "browser" | "program";

export type Task = {
  type: TaskType;
  title?: string;
  value: string;
  delay: number;
};

export type Profile = {
  id: string;
  name: string;
  tasks: Task[];
};

export type AppConfig = {
  profiles: Profile[];
  activeProfileId: string;
  autoStartProfileId: string;
};

export interface ElectronAPI {
  runTasks: (tasks: Task[]) => Promise<void>;
  runSingleTask: (task: Task) => Promise<void>;
  stopTasks: () => Promise<void>;
  saveConfig: (config: AppConfig) => Promise<void>;
  loadConfig: () => Promise<AppConfig>;
  selectFile: () => Promise<string | null>;
  exportConfig: (config: AppConfig) => Promise<boolean>;
  importConfig: () => Promise<AppConfig | null>;
  getAutoStart: () => Promise<boolean>;
  setAutoStart: (val: boolean) => Promise<void>;
  isAutoStart: () => Promise<boolean>;
  notifyDirtyState: (config: AppConfig, dirty: boolean) => void;
  onTaskError: (
    callback: (data: { task: Task; message: string }) => void
  ) => () => void;
  onTaskStarted: (
    callback: (data: { task: Task; index: number; total: number }) => void
  ) => () => void;
  onRunFinished: (callback: () => void) => () => void;
  onConfigLoadWarning: (callback: (data: { path: string }) => void) => () => void;
}
