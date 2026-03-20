const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadURL("http://localhost:5173");
}

app.whenReady().then(createWindow);

// CONFIG LOAD
ipcMain.handle("load-config", async () => {
  try {
    const data = fs.readFileSync("./config.json");
    return JSON.parse(data).tasks;
  } catch {
    return [];
  }
});

// CONFIG SAVE
ipcMain.handle("save-config", async (_, tasks) => {
  fs.writeFileSync("./config.json", JSON.stringify({ tasks }, null, 2));
});

// RUN TASKS
ipcMain.handle("run-tasks", async (_, tasks) => {
  let totalDelay = 0;

  for (const task of tasks) {
    totalDelay += task.delay || 0;

    setTimeout(() => {
      try {
        if (task.type === "browser") {
          // 크롬 실행
          exec(`start chrome "${task.value}"`);
        } else if (task.type === "program") {
          // VSCode 폴더 열기 지원
          if (task.value.startsWith("code ")) {
            exec(task.value); // ex: code "C:\project"
          } else {
            exec(`"${task.value}"`); // 일반 exe 실행
          }
        }
      } catch (e) {
        console.error("실행 오류:", e);
      }
    }, totalDelay * 1000); // 👉 초 단위 적용
  }
});

// FILE SELECT
ipcMain.handle("select-file", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
  });

  if (result.canceled) return null;
  return result.filePaths[0];
});
