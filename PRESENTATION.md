# DeskReady 아키텍처 발표 — 슬라이드 아웃라인

`ARCHITECTURE.md`를 발표용으로 압축한 초안입니다. 슬라이드 제목 = `##`, 본문 불릿 =
그대로 파워포인트 개요 보기(Outline View)에 붙여넣으면 슬라이드가 나뉩니다.

---

## DeskReady
- 매일 아침 반복되는 "출근 준비"를 한 번의 클릭으로 자동화하는 Windows 데스크톱 앱
- 아키텍처 & 핵심 로직 설명

---

## 한 줄 정의
- 크롬으로 특정 사이트 열기 + 프로그램/VS Code 폴더 실행을 순서·딜레이가 있는 목록으로 등록
- 한 번의 클릭 또는 윈도우 로그인 시 자동 실행

---

## 프로세스 구조 — 완전히 분리된 두 패키지
- 저장소 루트: Electron 메인 프로세스 (`electron/main.js`)
- `react-app/`: Vite + React + TypeScript 렌더러
- 워크스페이스 아님 — 각자 `node_modules`/lockfile
- 개발 시 두 프로세스 동시 실행: Vite dev server(`:5173`) + `electron .`
- 패키징 시 `base: "./"` 누락하면 빈 화면 (실제 겪었던 버그)

---

## IPC 경계 — 렌더러는 Node API를 절대 직접 못 만짐
- `preload.js`의 `contextBridge`로 `window.electronAPI`만 노출
- 새 기능 추가 시 3곳을 손으로 동기화: `main.js` ↔ `preload.js` ↔ `types.ts`
- 대표 채널: `run-tasks`, `stop-tasks`, `load/save-config`, `get/set-auto-start`,
  `notify-dirty-state`, `task-execution-error`

---

## 데이터 모델 & 저장 방식
- `Task { type, title?, value, delay(초) }` / `Profile { id, name, tasks }`
- `AppConfig { profiles, activeProfileId, autoStartProfileId }`
- 저장 위치: `app.getPath("userData")/config.json` (레포와 무관한 OS 데이터 폴더)
- 옛 `{ tasks: [...] }` 포맷 → "기본" 프로필로 자동 마이그레이션

---

## 실행 로직 핵심 ① — 누적 딜레이
- 각 task의 `delay`는 개별이 아니라 **리스트 전체에 누적**
- 3번째 작업의 대기시간 = 1~3번 delay의 합
- 재실행 시 `pendingTimeouts`로 이전 예약 전부 취소 → 중복 실행 방지

---

## 실행 로직 핵심 ② — 안전한 셸 실행
- 브라우저 URL / 일반 `.exe` 경로 → `execFile` (셸 미경유, 인젝션 불가)
- `code "<folder>"`만 → `exec` (사용자가 입력한 셸 커맨드 문자열이라 불가피)
- 편의상 전부 `exec`로 통일하지 않는 것이 보안 설계의 핵심

---

## 자동 실행(윈도우 로그인 시)
- 별도 데몬/스케줄러 없음 — 로그인 시 앱이 `--autostart` 인자로 재실행
- 렌더러가 `is-autostart` 체크 → `autoStartProfileId` 세트를 즉시 `run-tasks`
- get/set이 반드시 동일한 `args`를 써야 함 (다르면 토글이 꺼진 것처럼 보이는 버그)
- `activeProfileId`(보는 중) ≠ `autoStartProfileId`(자동 실행 대상) — 의도적 분리

---

## 프론트엔드 상태 관리
- `App.tsx`가 모든 상태 소유, 콜백을 props로 하위 전달 (별도 상태 라이브러리 없음)
- `TaskForm` / `TaskList` 편집모드가 `TaskEntryForm`을 `variant` prop으로 공유
- dirty-state를 계속 메인 프로세스로 흘려보내 → 저장 안 하고 닫으면 확인 다이얼로그

---

## 테스트 전략
- 단위 테스트(Vitest): `utils.ts`의 순수 로직만 (딜레이 포맷/단위 변환/재배치)
- E2E(Playwright `_electron`): 임시 `--user-data-dir`로 실제 앱을 띄워 10개 시나리오 검증
- fixture가 창을 강제 `destroy()`하는 이유: 저장 확인 다이얼로그에 테스트가 멈추는 것 방지

---

## 패키징
- `electron-builder` → NSIS 설치본 + 포터블 exe (`npm run dist`)
- `electron`/`electron-builder`는 devDependencies 고정 (배포 앱에 300MB 안 딸려가게)

---

## 설계 원칙
1. 원클릭이면 충분해야 함
2. 신뢰할 수 있는 자동화 — 무인 실행이라 상태/에러가 조용히 묻히면 안 됨
3. 비개발자에게 넘겨도 쓸 수 있는 단순함
4. 매일 아침 5초 훑어보는 도구, 오래 머무는 대시보드 아님

---

## 핵심 포인트 요약
1. 메인/렌더러 분리 + IPC 계약을 3곳에서 손으로 맞추는 구조
2. 딜레이는 "개별"이 아니라 "누적" — 실행 모델의 핵심 트릭
3. `execFile` vs `exec` — 값의 성격에 따른 보안 설계
4. 활성 프로필 vs 자동실행 프로필의 의도적 분리
5. dirty-state를 메인으로 계속 흘려보내 창 닫기 직전 데이터 손실 방지
