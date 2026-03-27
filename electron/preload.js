const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  runTasks: (tasks) => ipcRenderer.invoke("run-tasks", tasks),
  saveConfig: (tasks) => ipcRenderer.invoke("save-config", tasks),
  loadConfig: () => ipcRenderer.invoke("load-config"),
  selectFile: () => ipcRenderer.invoke("select-file"),
  getAutoStart: () => ipcRenderer.invoke("get-auto-start"),
  setAutoStart: (val) => ipcRenderer.invoke("set-auto-start", val),
  isAutoStart: () => ipcRenderer.invoke("is-autostart"),
});