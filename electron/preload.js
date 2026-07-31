const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  runTasks: (tasks) => ipcRenderer.invoke("run-tasks", tasks),
  runSingleTask: (task) => ipcRenderer.invoke("run-single-task", task),
  stopTasks: () => ipcRenderer.invoke("stop-tasks"),
  saveConfig: (tasks) => ipcRenderer.invoke("save-config", tasks),
  loadConfig: () => ipcRenderer.invoke("load-config"),
  selectFile: () => ipcRenderer.invoke("select-file"),
  getAutoStart: () => ipcRenderer.invoke("get-auto-start"),
  setAutoStart: (val) => ipcRenderer.invoke("set-auto-start", val),
  isAutoStart: () => ipcRenderer.invoke("is-autostart"),
  notifyDirtyState: (tasks, dirty) =>
    ipcRenderer.send("notify-dirty-state", { tasks, dirty }),
  onTaskError: (callback) => {
    const listener = (_, data) => callback(data);
    ipcRenderer.on("task-execution-error", listener);
    return () => ipcRenderer.removeListener("task-execution-error", listener);
  },
  onTaskStarted: (callback) => {
    const listener = (_, data) => callback(data);
    ipcRenderer.on("task-started", listener);
    return () => ipcRenderer.removeListener("task-started", listener);
  },
  onRunFinished: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("run-tasks-finished", listener);
    return () => ipcRenderer.removeListener("run-tasks-finished", listener);
  },
});