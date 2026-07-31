const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const { exec, execFile } = require("child_process");
const fs = require("fs");
const path = require("path");

let isDirty = false;
let latestTasks = [];

ipcMain.on("notify-dirty-state", (_, { tasks, dirty }) => {
  latestTasks = tasks;
  isDirty = dirty;
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, "../react-app/dist/index.html"));
  } else {
    win.loadURL("http://localhost:5173");
  }

  // 저장 안 한 변경사항이 있는 채로 창을 닫으면 조용히 소실되는 문제 방지
  win.on("close", (e) => {
    if (!isDirty) return;

    e.preventDefault();

    const choice = dialog.showMessageBoxSync(win, {
      type: "question",
      buttons: ["저장하고 닫기", "저장하지 않고 닫기", "취소"],
      defaultId: 0,
      cancelId: 2,
      noLink: true,
      message: "저장하지 않은 변경사항이 있어요",
      detail: "지금 닫으면 변경사항이 사라집니다.",
    });

    if (choice === 0) {
      saveConfigToDisk(latestTasks);
      isDirty = false;
      win.destroy();
    } else if (choice === 1) {
      isDirty = false;
      win.destroy();
    }
    // choice === 2 (취소): 아무 것도 하지 않고 창을 유지
  });
}

app.whenReady().then(createWindow);

// 창을 모두 닫으면 앱도 함께 종료 (없으면 백그라운드에 프로세스가 남음)
app.on("window-all-closed", () => {
  app.quit();
});

const configPath = path.join(app.getPath("userData"), "config.json");

function saveConfigToDisk(tasks) {
  fs.writeFileSync(configPath, JSON.stringify({ tasks }, null, 2));
}

// CONFIG LOAD
ipcMain.handle("load-config", async () => {
  try {
    const data = fs.readFileSync(configPath);
    const parsed = JSON.parse(data);
    return Array.isArray(parsed.tasks) ? parsed.tasks : [];
  } catch {
    return [];
  }
});

// CONFIG SAVE
ipcMain.handle("save-config", async (_, tasks) => {
  saveConfigToDisk(tasks);
});

// RUN TASKS
let pendingTimeouts = [];

ipcMain.handle("run-tasks", async (_, tasks) => {
  // 이전 실행에서 예약된 작업이 남아있다면 취소하여 중복 실행 방지
  pendingTimeouts.forEach(clearTimeout);
  pendingTimeouts = [];

  let totalDelay = 0;

  for (const task of tasks) {
    totalDelay += task.delay || 0;

    const timeoutId = setTimeout(() => {
      try {
        if (task.type === "browser") {
          // execFile로 실행해 URL에 특수문자가 있어도 셸 인젝션 없이 안전하게 처리
          execFile("cmd.exe", ["/c", "start", "chrome", task.value], (e) => {
            if (e) console.error("크롬 실행 오류:", e);
          });
        } else if (task.type === "program") {
          if (task.value.startsWith("code ")) {
            // 사용자가 직접 입력한 셸 커맨드라 셸 실행이 불가피함 (ex: code "C:\project")
            exec(task.value, (e) => {
              if (e) console.error("프로그램 실행 오류:", e);
            });
          } else {
            // execFile로 실행해 경로에 공백/특수문자가 있어도 안전하게 처리
            execFile(task.value, [], (e) => {
              if (e) console.error("프로그램 실행 오류:", e);
            });
          }
        }
      } catch (e) {
        console.error("실행 오류:", e);
      }
    }, totalDelay * 1000); // 👉 초 단위 적용

    pendingTimeouts.push(timeoutId);
  }
});

// GET AUTO START STATUS
ipcMain.handle("get-auto-start", async () => {
  return app.getLoginItemSettings().openAtLogin;
});

// SET AUTO START STATUS
ipcMain.handle("set-auto-start", async (_, openAtLogin) => {
  app.setLoginItemSettings({
    openAtLogin,
    path: app.getPath("exe"),
    args: ["--autostart"],
  });
});

// CHECK IF STARTED VIA AUTOSTART
ipcMain.handle("is-autostart", async () => {
  return process.argv.includes("--autostart");
});

// FILE SELECT
ipcMain.handle("select-file", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
  });

  if (result.canceled) return null;
  return result.filePaths[0];
});
