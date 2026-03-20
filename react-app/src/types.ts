export type TaskType = "browser" | "program";

export type Task = {
  type: TaskType;
  value: string;
  delay: number;
};

export interface ElectronAPI {
  runTasks: (tasks: Task[]) => Promise<void>;
  saveConfig: (tasks: Task[]) => Promise<void>;
  loadConfig: () => Promise<Task[]>;
  selectFile: () => Promise<string | null>;
}