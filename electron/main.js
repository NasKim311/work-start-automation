const { app, BrowserWindow, ipcMain, dialog, session } = require("electron");
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

app.whenReady().then(() => {
  // CSP는 패키징된 빌드에만 건다 — 개발 모드는 Vite dev server(HMR용
  // eval/websocket)를 그대로 쓰므로 여기서 제한하면 개발 환경이 깨진다.
  // 배포되는 실제 사용자용 빌드는 전부 로컬 번들 파일만 로드하므로 외부
  // 출처를 허용할 이유가 없다.
  if (app.isPackaged) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [
            [
              "default-src 'self'",
              "script-src 'self'",
              // index.css가 Pretendard(jsdelivr)/Caveat(Google Fonts) 웹폰트 스타일시트를
              // @import로 불러오므로 그 출처를 명시적으로 허용해야 함
              "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com",
              "font-src 'self' https://cdn.jsdelivr.net https://fonts.gstatic.com",
              "img-src 'self' data:",
              "connect-src 'self'",
              "object-src 'none'",
              "base-uri 'none'",
            ].join("; "),
          ],
        },
      });
    });
  }

  createWindow();
});

// 창을 모두 닫으면 앱도 함께 종료 (없으면 백그라운드에 프로세스가 남음)
app.on("window-all-closed", () => {
  app.quit();
});

const configPath = path.join(app.getPath("userData"), "config.json");
const configBakPath = configPath + ".bak";

function saveConfigToDisk(config) {
  // 새 내용을 쓰기 전에 "직전까지 정상적으로 읽혔던" 상태를 .bak으로 남겨서,
  // 다음 로드가 실패하더라도 자동 복구할 발판을 유지한다. 기존 config.json이
  // 이미 손상돼 있으면(파싱 실패) 그 내용으로 기존 .bak을 덮어쓰지 않는다 —
  // 손상된 데이터로 마지막 정상 백업을 지워버리는 걸 막기 위함.
  try {
    if (fs.existsSync(configPath)) {
      const existing = fs.readFileSync(configPath);
      JSON.parse(existing);
      fs.copyFileSync(configPath, configBakPath);
    }
  } catch {
    // 기존 파일이 없거나 이미 손상됨 — 백업 갱신을 건너뛰고 기존 .bak을 보존
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// 가져오기(import-config)로 들어오는 외부 JSON은 신뢰할 수 없으므로, 실행 가능한
// task로 취급하기 전에 형태를 엄격히 검증한다 — 특히 value는 exec()로 셸에
// 넘어갈 수 있는 값이라 문자열 타입 확인만으로 인젝션 자체를 막지는 못하지만,
// 최소한 형태가 어긋난(구조가 깨진) 데이터가 그대로 실행 경로까지 흘러가는 것은 막는다.
function isValidTask(t) {
  return (
    t &&
    typeof t === "object" &&
    (t.type === "browser" || t.type === "program") &&
    typeof t.value === "string" &&
    typeof t.delay === "number" &&
    (t.title === undefined || typeof t.title === "string") &&
    (t.enabled === undefined || typeof t.enabled === "boolean")
  );
}

function isValidProfile(p) {
  return (
    p &&
    typeof p === "object" &&
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    Array.isArray(p.tasks) &&
    p.tasks.every(isValidTask)
  );
}

// 요일별 자동실행 프로필. 0=일 ~ 6=토(JS Date.getDay()과 동일 인덱스), 값은
// profileId 또는 "그 요일엔 자동 실행 안 함"을 뜻하는 null.
function isValidAutoStartByDay(v) {
  if (!v || typeof v !== "object") return false;
  for (let day = 0; day <= 6; day++) {
    const val = v[day];
    if (val !== null && typeof val !== "string") return false;
  }
  return true;
}

function makeAutoStartByDay(profileId) {
  return { 0: profileId, 1: profileId, 2: profileId, 3: profileId, 4: profileId, 5: profileId, 6: profileId };
}

// profiles는 유효하지만 autoStartByDay가 없거나 형태가 잘못된 설정(요일별 지정
// 기능 도입 전의 옛 버전, 또는 그 옛 버전에서 내보낸 파일)을 보정한다. 그보다도
// 더 옛날 단일 필드(autoStartProfileId)가 있으면 그 프로필로 7일을 채우고,
// 그것도 없으면 첫 프로필로 채운다.
function normalizeAutoStartByDay(parsed) {
  if (isValidAutoStartByDay(parsed.autoStartByDay)) {
    return parsed.autoStartByDay;
  }
  const fallbackId =
    typeof parsed.autoStartProfileId === "string"
      ? parsed.autoStartProfileId
      : parsed.profiles[0].id;
  return makeAutoStartByDay(fallbackId);
}

function isValidAppConfig(c) {
  return (
    c &&
    typeof c === "object" &&
    Array.isArray(c.profiles) &&
    c.profiles.length > 0 &&
    c.profiles.every(isValidProfile) &&
    typeof c.activeProfileId === "string" &&
    isValidAutoStartByDay(c.autoStartByDay)
  );
}

// config.json 파싱이 실패했을 때, 직전 저장 시점에 남긴 .bak으로 자동 복구를
// 시도한다. .bak도 없거나 손상돼 있으면 null.
function tryRecoverFromBackup() {
  try {
    const parsed = JSON.parse(fs.readFileSync(configBakPath));
    return isValidAppConfig(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// 자동 복구(.bak)도 불가능한 최후의 경우, 손상된 원본을 지우지 않고 타임스탬프
// 붙은 별도 파일로 보존해 사용자가 나중에 직접 확인/복구할 수 있게 한다.
function preserveCorruptedFile(raw) {
  const backupPath = path.join(
    path.dirname(configPath),
    `config.corrupted-${Date.now()}.json`
  );
  try {
    fs.writeFileSync(backupPath, raw);
    return backupPath;
  } catch (e) {
    console.error("손상된 설정 파일 보존 실패:", e);
    return null;
  }
}

function makeDefaultConfig(tasks = []) {
  const id = randomUUID();
  return {
    profiles: [{ id, name: "기본", tasks }],
    activeProfileId: id,
    autoStartByDay: makeAutoStartByDay(id),
  };
}

// CONFIG LOAD — 여러 루틴 세트(profiles)를 지원하기 전 옛 { tasks: [...] } 형식이면
// "기본" 프로필 하나로 자동 이관하고, 이관된 형식을 곧바로 디스크에 반영한다.
ipcMain.handle("load-config", async (event) => {
  let raw;
  try {
    raw = fs.readFileSync(configPath);
  } catch {
    // 파일이 아직 없음 — 첫 실행이라 정상 상황, 경고 없이 기본값 반환
    return makeDefaultConfig();
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // 파일은 있는데 JSON 파싱에 실패 = 손상된 설정 파일. 우선 직전 저장 시점의
    // .bak으로 자동 복구를 시도하고, 성공하면 그 내용으로 config.json 자체를
    // 즉시 재저장해 다음 실행부터는 정상적으로 읽히도록 자가 치유한다.
    const recovered = tryRecoverFromBackup();
    if (recovered) {
      saveConfigToDisk(recovered);
      if (!event.sender.isDestroyed()) {
        event.sender.send("config-load-warning", { recovered: true, path: configPath });
      }
      return recovered;
    }

    // .bak도 없거나 손상됨 — 손상된 원본을 별도 파일로 보존해두고(덮어쓰지 않음)
    // 렌더러에 알려서 사용자가 "루틴이 사라졌다"고 오해하지 않게 한다.
    const backupPath = preserveCorruptedFile(raw);
    if (!event.sender.isDestroyed()) {
      event.sender.send("config-load-warning", {
        recovered: false,
        path: configPath,
        backupPath,
      });
    }
    return makeDefaultConfig();
  }

  if (Array.isArray(parsed.profiles) && parsed.profiles.length > 0) {
    if (isValidAutoStartByDay(parsed.autoStartByDay)) {
      return parsed;
    }
    // 요일별 자동실행 지정 기능 도입 전 형식(단일 autoStartProfileId 또는 그마저
    // 없는 형식) — autoStartByDay로 보정해 곧바로 디스크에 반영한다.
    const migrated = { ...parsed, autoStartByDay: normalizeAutoStartByDay(parsed) };
    delete migrated.autoStartProfileId;
    saveConfigToDisk(migrated);
    return migrated;
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
  // enabled === false로 꺼진 작업은 누적 딜레이 계산에서도, 실행에서도 완전히 제외
  const runnableTasks = tasks.filter((task) => task.enabled !== false);

  if (runnableTasks.length === 0) {
    // 스케줄할 작업이 하나도 없으면 이벤트가 전혀 안 뜨는데, 렌더러의 "실행 중"
    // 상태는 run-tasks-finished로만 풀리므로 여기서 즉시 보내줘야 버튼이 멈추지 않는다
    if (!sender.isDestroyed()) {
      sender.send("run-tasks-finished");
    }
    return;
  }

  let totalDelay = 0;

  runnableTasks.forEach((task, index) => {
    totalDelay += task.delay || 0;

    const timeoutId = setTimeout(() => {
      if (!sender.isDestroyed()) {
        sender.send("task-started", { task, index, total: runnableTasks.length });
      }
      runSingleTask(task, sender);
      if (index === runnableTasks.length - 1 && !sender.isDestroyed()) {
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

// 패키징된 앱은 exe 경로 자체가 곧 앱이라 인자로 --autostart만 있으면 되지만,
// 개발 모드(electron .)는 electron.exe가 범용 실행기라 이 프로젝트 경로를 인자로
// 같이 넘겨야 부팅 시 실제로 DeskReady가 로드된다. get/set이 서로 다른 args로
// 로그인 항목을 조회/등록하면 Windows가 다른 항목으로 취급해 상태 조회가
// 어긋나므로 항상 동일한 args를 써야 한다.
const autoStartArgs = app.isPackaged
  ? ["--autostart"]
  : [app.getAppPath(), "--autostart"];

// GET AUTO START STATUS
ipcMain.handle("get-auto-start", async () => {
  return app.getLoginItemSettings({ args: autoStartArgs }).openAtLogin;
});

// SET AUTO START STATUS
ipcMain.handle("set-auto-start", async (_, openAtLogin) => {
  app.setLoginItemSettings({
    openAtLogin,
    path: app.getPath("exe"),
    args: autoStartArgs,
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

// EXPORT CONFIG (다른 PC로 옮기기 위해 파일로 저장)
ipcMain.handle("export-config", async (event, config) => {
  const result = await dialog.showSaveDialog(BrowserWindow.fromWebContents(event.sender), {
    title: "설정 내보내기",
    defaultPath: "deskready-config.json",
    filters: [{ name: "JSON", extensions: ["json"] }],
  });

  if (result.canceled || !result.filePath) return false;
  fs.writeFileSync(result.filePath, JSON.stringify(config, null, 2));
  return true;
});

// IMPORT CONFIG (내보내기 파일 또는 옛 { tasks: [...] } 형식 모두 지원)
ipcMain.handle("import-config", async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);

  // 가져온 설정의 프로그램 실행 항목은 확인 절차 없이 그대로 실행될 수 있으므로,
  // 파일을 고르기 전에 출처를 신뢰하는지 먼저 확인한다.
  const trustChoice = dialog.showMessageBoxSync(win, {
    type: "warning",
    buttons: ["계속", "취소"],
    defaultId: 1,
    cancelId: 1,
    noLink: true,
    message: "신뢰할 수 있는 파일만 가져오세요",
    detail:
      "가져온 설정에 포함된 프로그램 실행 항목은 별도 확인 없이 자동으로 실행될 수 있습니다. 출처를 모르는 파일은 가져오지 마세요.",
  });
  if (trustChoice !== 0) return null;

  const result = await dialog.showOpenDialog(win, {
    title: "설정 가져오기",
    filters: [{ name: "JSON", extensions: ["json"] }],
    properties: ["openFile"],
  });

  if (result.canceled || result.filePaths.length === 0) return null;

  try {
    const parsed = JSON.parse(fs.readFileSync(result.filePaths[0]));
    if (isValidAppConfig(parsed)) {
      return parsed;
    }
    // profiles는 유효한데 요일별 자동실행 지정 기능 도입 전 형식으로 내보낸
    // 파일이면 autoStartByDay를 보정해서 받아들인다.
    if (
      Array.isArray(parsed.profiles) &&
      parsed.profiles.length > 0 &&
      parsed.profiles.every(isValidProfile)
    ) {
      return {
        profiles: parsed.profiles,
        activeProfileId:
          typeof parsed.activeProfileId === "string"
            ? parsed.activeProfileId
            : parsed.profiles[0].id,
        autoStartByDay: normalizeAutoStartByDay(parsed),
      };
    }
    if (Array.isArray(parsed.tasks) && parsed.tasks.every(isValidTask)) {
      return makeDefaultConfig(parsed.tasks);
    }
    return null;
  } catch {
    return null;
  }
});
