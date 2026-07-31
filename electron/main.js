const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const { exec, execFile } = require("child_process");
const { randomUUID } = require("crypto");
const fs = require("fs");
const path = require("path");

let isDirty = false;
let latestConfig = null;

ipcMain.on("notify-dirty-state", (_, { config, dirty }) => {
  latestConfig = config;
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
      if (latestConfig) saveConfigToDisk(latestConfig);
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

function saveConfigToDisk(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function makeDefaultConfig(tasks = []) {
  const id = randomUUID();
  return {
    profiles: [{ id, name: "기본", tasks }],
    activeProfileId: id,
    autoStartProfileId: id,
  };
}

// CONFIG LOAD — 여러 루틴 세트(profiles)를 지원하기 전 옛 { tasks: [...] } 형식이면
// "기본" 프로필 하나로 자동 이관하고, 이관된 형식을 곧바로 디스크에 반영한다.
ipcMain.handle("load-config", async () => {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(configPath));
  } catch {
    return makeDefaultConfig();
  }

  if (Array.isArray(parsed.profiles) && parsed.profiles.length > 0) {
    return parsed;
  }

  const migrated = makeDefaultConfig(Array.isArray(parsed.tasks) ? parsed.tasks : []);
  saveConfigToDisk(migrated);
  return migrated;
});

// CONFIG SAVE
ipcMain.handle("save-config", async (_, config) => {
  saveConfigToDisk(config);
});

// RUN TASKS
let pendingTimeouts = [];

function clearPendingTasks() {
  pendingTimeouts.forEach(clearTimeout);
  pendingTimeouts = [];
}

function runSingleTask(task, sender) {
  const reportError = (error) => {
    console.error("실행 오류:", error);
    if (!sender.isDestroyed()) {
      sender.send("task-execution-error", { task, message: error.message });
    }
  };

  try {
    if (task.type === "browser") {
      // execFile로 실행해 URL에 특수문자가 있어도 셸 인젝션 없이 안전하게 처리
      execFile("cmd.exe", ["/c", "start", "chrome", task.value], (e) => {
        if (e) reportError(e);
      });
    } else if (task.type === "program") {
      if (task.value.startsWith("code ")) {
        // 사용자가 직접 입력한 셸 커맨드라 셸 실행이 불가피함 (ex: code "C:\project")
        exec(task.value, (e) => {
          if (e) reportError(e);
        });
      } else {
        // execFile로 실행해 경로에 공백/특수문자가 있어도 안전하게 처리
        execFile(task.value, [], (e) => {
          if (e) reportError(e);
        });
      }
    }
  } catch (e) {
    reportError(e);
  }
}

ipcMain.handle("run-tasks", async (event, tasks) => {
  // 이전 실행에서 예약된 작업이 남아있다면 취소하여 중복 실행 방지
  clearPendingTasks();

  const sender = event.sender;
  let totalDelay = 0;

  tasks.forEach((task, index) => {
    totalDelay += task.delay || 0;

    const timeoutId = setTimeout(() => {
      if (!sender.isDestroyed()) {
        sender.send("task-started", { task, index, total: tasks.length });
      }
      runSingleTask(task, sender);
      if (index === tasks.length - 1 && !sender.isDestroyed()) {
        sender.send("run-tasks-finished");
      }
    }, totalDelay * 1000); // 👉 초 단위 적용

    pendingTimeouts.push(timeoutId);
  });
});

// RUN SINGLE TASK (딜레이 무시하고 즉시 실행 — 목록 전체를 안 돌리고 개별 확인용)
ipcMain.handle("run-single-task", async (event, task) => {
  runSingleTask(task, event.sender);
});

// STOP TASKS (아직 실행되지 않은 예약분만 취소 — 이미 시작된 프로세스는 중단하지 않음)
ipcMain.handle("stop-tasks", async () => {
  clearPendingTasks();
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
