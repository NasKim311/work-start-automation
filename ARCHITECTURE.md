# ARCHITECTURE

DeskReady의 구조와 핵심 로직을 다른 사람에게 설명하거나, 시간이 지난 뒤 스스로 다시 파악할 때
참고할 수 있도록 정리한 문서입니다.

## 1. 한 줄 정의

Windows용 Electron 앱으로, "출근하면 매일 반복하는 작업"(크롬으로 특정 사이트 열기,
프로그램/VS Code 폴더 실행)을 순서·딜레이가 있는 목록으로 만들어두고, 한 번의 클릭 또는
윈도우 로그인 시 자동으로 실행시켜주는 개인용 도구입니다.

## 2. 프로세스 구조 (두 개의 독립 npm 패키지)

```
저장소 루트 (Electron 메인 프로세스)          react-app/ (Vite + React + TS 렌더러)
├─ electron/main.js    ← 앱 진입점           ├─ src/App.tsx        ← 전체 상태 소유
├─ electron/preload.js ← contextBridge       ├─ src/components/*.tsx
├─ package.json (own node_modules)           └─ package.json (own node_modules)
```

- 워크스페이스가 아니라 각자 `node_modules`/lockfile을 가진 완전히 별개의 패키지입니다.
- 개발 시엔 항상 **두 프로세스**가 필요합니다: `react-app`에서 Vite dev server(`:5173`
  고정), 루트에서 `electron .`. `main.js`가 `app.isPackaged` 여부로
  `loadURL("http://localhost:5173")` vs `loadFile(".../dist/index.html")`를 분기합니다.
- 패키징 시 `vite.config.ts`의 `base: "./"`가 핵심입니다 — 없으면 프로덕션 빌드가
  절대경로 에셋을 참조해 `file://`로 로드하는 Electron 환경에서 JS/CSS 로드가 실패하고
  빈 화면만 뜹니다 (실제로 겪었던 버그, `TODO.md`에 기록됨). 패키징된 앱이 빈 화면이면
  이것부터 확인.

## 3. IPC 경계 — 렌더러는 Node/Electron API를 절대 직접 안 만짐

`electron/preload.js`가 `contextBridge`로 `window.electronAPI`만 노출합니다. 새 IPC
기능을 추가하려면 항상 3곳을 손으로 동기화해야 합니다:

1. `electron/main.js`의 `ipcMain.handle(...)` (또는 단방향 알림이면 `ipcMain.on(...)`)
2. `electron/preload.js`의 매칭되는 브릿지 메서드
3. `react-app/src/types.ts`의 `ElectronAPI` 인터페이스

현재 채널 요약:

| 채널 | 방향 | 역할 |
|---|---|---|
| `load-config` / `save-config` | R↔M | `userData/config.json` 읽기/쓰기 |
| `run-tasks` | R→M | 목록 전체를 누적 딜레이로 예약 실행 |
| `run-single-task` | R→M | 딜레이 무시하고 즉시 1개 테스트 실행 |
| `stop-tasks` | R→M | 아직 실행 안 된 예약분만 취소 |
| `select-file` | R→M | 프로그램 경로 선택 다이얼로그 |
| `export-config` / `import-config` | R↔M | 설정 JSON 파일로 백업/이전 |
| `get-auto-start` / `set-auto-start` / `is-autostart` | R↔M | 윈도우 로그인 자동실행 |
| `notify-dirty-state` | R→M (단방향, `send`) | 렌더러가 현재 상태+dirty 플래그를 알려, 창 닫기 시 저장 확인 다이얼로그를 띄울 수 있게 함 |
| `task-execution-error` | M→R (단방향) | 실행 실패를 alert로 보이게 함 |
| `task-started` / `run-tasks-finished` | M→R (단방향) | "출근 시작하기" 버튼의 진행 상태 표시 |

## 4. 데이터 모델 & 저장 방식

```ts
Task      = { type: "browser" | "program", title?, value, delay(초) }
Profile   = { id, name, tasks: Task[] }
AppConfig = { profiles: Profile[], activeProfileId, autoStartProfileId }
```

- 저장 위치는 `app.getPath("userData")/config.json` — 레포와 무관한 OS 사용자 데이터
  폴더입니다. (과거 실수로 repo-root에 `config.json`이 커밋된 적이 있어 지금은
  gitignore 대상.)
- 이 폴더 이름은 `app.name`(≈ 루트 `package.json`의 `productName`)에서 파생되는데,
  루트 `package.json`엔 **의도적으로 top-level `productName`이 없습니다.** 있으면
  개발 모드 userData 폴더 이름이 바뀌어 기존 config를 못 찾는 문제가 생기기 때문 —
  `build.productName`(electron-builder 전용, 패키징된 앱/설치본 이름에만 쓰임)만
  존재합니다.
- 옛 단일 목록 `{ tasks: [...] }` 포맷은 `load-config`가 감지해서 "기본"이라는
  프로필 하나짜리 `AppConfig`로 자동 마이그레이션한 뒤 즉시 디스크에 재저장합니다
  (한 번만 일어남).

## 5. 실행 로직의 핵심 — 누적 딜레이 + 안전한 셸 실행

`run-tasks`(`electron/main.js`)에서 각 task의 `delay`는 **개별이 아니라 리스트 전체에
누적**됩니다:

```js
let totalDelay = 0;
tasks.forEach((task) => {
  totalDelay += task.delay;
  setTimeout(() => runSingleTask(task), totalDelay * 1000);
});
```

즉 3번째 작업의 실제 대기시간은 자신의 `delay`가 아니라 1~3번 `delay`의 합입니다.
재실행 시 `pendingTimeouts` 배열에 쌓인 이전 예약을 전부 `clearTimeout`해서 중복
실행을 막습니다 (`stop-tasks`도 같은 `clearPendingTasks` 헬퍼를 재사용 — 단, 이미
시작된 프로세스는 죽이지 못하고 아직 안 실행된 예약분만 취소).

실행 방식은 값의 성격에 따라 의도적으로 두 갈래로 나뉩니다:

- `type: "browser"`, 일반 `.exe` 경로 → **`execFile`** (셸을 거치지 않으므로 URL/경로에
  특수문자가 있어도 셸 인젝션이 불가능)
- `code "<folder>"` 값만 → **`exec`** (사용자가 직접 입력한 셸 커맨드 문자열이라 셸
  실행이 불가피)

이 구분은 보안상 중요한 설계 결정이므로, 이 코드를 건드릴 때 "편의상 전부 `exec`로
통일"하는 방향은 피해야 합니다.

## 6. 자동 실행(윈도우 로그인 시) 메커니즘

별도 데몬/스케줄러는 없습니다. 전체 흐름:

1. `app.setLoginItemSettings({ openAtLogin, path: app.getPath("exe"), args })`로 Windows가
   로그인 시 앱 자체를 다시 띄우게 등록.
2. 렌더러가 부팅 시 `is-autostart` (→ `process.argv.includes("--autostart")`)를 체크.
3. `true`면 `autoStartProfileId`에 해당하는 프로필을 찾아 OS 알림을 띄우고 즉시
   `run-tasks`로 실행.

`autoStartArgs`는 패키징 여부로 값이 달라집니다:
- 패키징됨 → `["--autostart"]` (exe 경로 자체가 곧 이 앱)
- 개발 모드 → `[app.getAppPath(), "--autostart"]` (`electron.exe`는 범용 실행기라
  프로젝트 경로를 인자로 안 주면 로그인 시 어떤 앱을 열어야 할지 모름)

`get-auto-start`도 반드시 `set-auto-start`와 **동일한** `autoStartArgs`로
`app.getLoginItemSettings({ args })`를 호출해야 합니다. Windows는 `args`가 다르면
아예 다른 로그인 항목으로 취급하기 때문에, get/set이 어긋나면 방금 켠 자동실행이
매번 꺼진 것처럼 보이는 버그가 생깁니다 (실제로 있었던 버그, 최근 수정됨).

`activeProfileId`(지금 UI에 열려있는 세트)와 `autoStartProfileId`(로그인 시 실행될
세트)는 의도적으로 독립적입니다 — 보고 있는 프로필을 바꿔도 자동실행 대상은 바뀌지
않습니다.

## 7. React 쪽 구조 & 상태 관리

- **상태는 전부 `App.tsx`가 소유**하고 콜백을 props로 내려주는 단방향 구조입니다
  (별도 상태관리 라이브러리 없음).
- `TaskForm.tsx`(추가용)와 `TaskList.tsx`의 인라인 편집 모드가 둘 다
  `TaskEntryForm.tsx`를 `variant: "add" | "edit"` prop으로 감싸 재사용합니다 —
  폼 마크업을 두 곳에서 따로 만들지 않는 패턴.
- `delay`는 항상 초 단위로 저장되고, UI에서만 초/분 표시 단위를 전환합니다
  (`utils.ts`의 `secondsToDisplay` / `displayToSeconds`) — 저장 포맷과
  `main.js`의 누적 계산 로직 호환성을 유지하기 위함.
- **dirty-state 추적**: `hasUnsavedChanges`가 바뀔 때마다 `notifyDirtyState` IPC로
  메인 프로세스에 최신 상태를 계속 흘려보내고, `main.js`의 `win.on("close", ...)`가
  이 상태를 보고 저장 여부를 묻는 네이티브 다이얼로그를 띄웁니다 (저장 안 하고 닫으면
  조용히 변경사항이 사라지는 문제 방지).
- 드래그 앤 드롭 + 위/아래 버튼 재배치는 둘 다 `utils.ts`의 순수함수 `reorderTasks`를
  공유합니다.
- Electron `BrowserWindow`는 `window.prompt()`를 지원하지 않기 때문에, 프로필
  추가/이름변경은 전용 인라인 입력 UI로 처리합니다 (네이티브 prompt 모달이 아님).

## 8. 테스트 전략

- **단위 테스트** (`react-app`, Vitest, `npm run test`) — React/Electron 의존성이
  없는 순수 로직만 다룹니다: `formatDelay`, 초↔분 변환, `reorderTasks`
  (`react-app/src/utils.ts`). 이 때문에 새로 추가하는 로직이 테스트 가능한
  성격이라면 컴포넌트에 인라인하지 말고 `utils.ts`로 뽑아내는 것이 이 프로젝트의
  관례입니다.
- **E2E 테스트** (저장소 루트, `@playwright/test` + `_electron`, `npm run test:e2e`,
  `e2e/*.spec.ts`) — 실제 Electron 앱을 격리된 임시 `--user-data-dir`로 띄워 삭제
  확인, 프로필, 드래그 재배치, 실행/중지, 저장 안 한 채로 닫기 다이얼로그 등을
  검증합니다. `e2e/fixtures.ts`의 teardown이 `close()` 대신 모든 창을 강제로
  `destroy()`하는데, 이는 테스트가 dirty 상태로 앱을 남기면 실제 "저장 안 한
  변경사항" 확인 다이얼로그가 떠서 아무도 응답하지 않는 채로 타임아웃까지 멈추는
  문제를 막기 위함입니다.

## 9. 패키징

`electron-builder`(루트 `package.json`의 `build` 필드)가 NSIS 설치본 + 포터블
exe를 `release/`에 생성합니다 (`npm run dist`). `electron`과 `electron-builder`는
의도적으로 `devDependencies`로만 둡니다 — electron-builder가 패키징 시 Electron
npm 패키지를 플랫폼 바이너리로 치환하기 때문에, `dependencies`에 있으면 ~300MB짜리
npm 패키지가 그대로 배포 앱에 번들링될 위험이 있습니다.

## 10. 설계 원칙 (`PRODUCT.md` 기준)

1. 원클릭이면 충분해야 함 — 반복되는 수동 아침 설정을 없애는 게 핵심 목적.
2. 신뢰할 수 있는 자동화 — 로그인 시 무인 상태로도 실행되므로, 상태와 에러가
   절대 조용히 묻히면 안 됨.
3. 셰어러블한 단순함 — 개발자 본인뿐 아니라 비개발자 지인에게 넘겨도 쓸 수 있어야 함.
4. 매일 아침 5초 훑어보는 도구지, 오래 머무는 대시보드가 아님.

## 11. 다른 사람에게 설명할 때 뽑을 만한 핵심 포인트 5가지

1. Electron 메인/렌더러 프로세스 분리 + IPC 계약을 3곳(main/preload/types)에서
   손으로 맞추는 구조.
2. 딜레이가 "개별"이 아니라 "누적"이라는 실행 모델의 핵심 트릭 (§5).
3. `execFile` vs `exec`를 값의 성격(안전한 경로 vs 사용자가 입력한 셸 커맨드)에
   따라 나눈 보안 설계 (§5).
4. 프로필의 "활성(activeProfileId)" vs "자동실행(autoStartProfileId)" 분리 (§6).
5. dirty-state를 렌더러 → 메인 프로세스로 계속 흘려보내 창 닫기 직전 데이터 손실을
   막는 패턴 (§7).
