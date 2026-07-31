# DeskReady ⚡

매일 아침 반복되는 업무 준비를 한 번의 클릭(또는 윈도우 로그인 시 자동)으로 끝내주는
Windows 데스크톱 앱입니다. 자주 여는 웹사이트와 프로그램을 순서·딜레이와 함께 등록해두면,
"출근 시작하기" 한 번으로 전부 실행됩니다.

## 소개

- **누가 쓰나요**: 지금은 개발자 본인이 매일 아침 데스크 세팅용으로 사용 중이며, 유용하면
  동료·지인에게도 배포할 수 있도록 염두에 두고 만들고 있습니다.
- **핵심 가치**: "한 번의 클릭이면 충분해야 한다" — 반복되는 수동 세팅 과정을 없애는 것이
  이 앱의 존재 이유입니다.

## 주요 기능

- 작업 등록: 웹사이트(Chrome으로 열기) 또는 프로그램(.exe 실행 / `code "<폴더>"`로 VS Code
  워크스페이스 열기) 두 가지 타입 지원
- 작업별 딜레이(초 단위, **목록 전체에 걸쳐 누적**) 설정
- 작업 추가 / 수정 / 삭제 / 순서 변경(위·아래)
- 설정 저장/불러오기 (사용자별 로컬 저장, 저장소에는 포함되지 않음)
- "출근 시작하기" 버튼으로 즉시 실행
- 윈도우 시작 시 자동 실행 옵션 (켜두면 로그인 직후 저장된 작업을 자동으로 실행)
- 한국어 UI

## 기술 스택 / 아키텍처

두 개의 독립된 npm 패키지로 구성되어 있습니다 (워크스페이스 아님):

- **저장소 루트** — Electron 메인 프로세스 (`electron/main.js`가 엔트리포인트)
- **`react-app/`** — Vite + React + TypeScript 렌더러, Tailwind v4로 스타일링

렌더러는 Node/Electron API에 직접 접근하지 않고, `electron/preload.js`가
`contextBridge`로 노출하는 `window.electronAPI`를 통해서만 메인 프로세스와 통신합니다.

새 IPC 기능을 추가하려면 아래 세 곳을 함께 수정해야 합니다:
1. `electron/main.js`의 `ipcMain.handle(...)`
2. `electron/preload.js`의 대응 브릿지 메서드
3. `react-app/src/types.ts`의 `ElectronAPI` 인터페이스

더 자세한 아키텍처/컨벤션은 [`CLAUDE.md`](CLAUDE.md)를 참고하세요.

## 실행 방법

개발 서버(Vite)와 Electron 셸을 각각 다른 터미널에서 띄워야 합니다:

```bash
# 터미널 1 — Vite 개발 서버 (5173 포트 고정)
cd react-app
npm install
npm run dev

# 터미널 2 — Electron 셸
npm install   # 저장소 루트에서
npm start
```

기타 `react-app` 명령어: `npm run build`, `npm run lint`, `npm run preview`.
테스트 스위트는 아직 없습니다.

패키징(electron-builder 등)은 아직 설정되어 있지 않습니다 — `npm run build`로 만든
`react-app/dist` 결과물을 패키징된 앱이 로드하도록 하는 분기(`app.isPackaged`)만 준비된
상태입니다.

## 디자인 시스템

UI는 "모닝 노트" 디자인 시스템을 따릅니다 (네이비 히어로 배너 + 크림색 점선 노트 카드 +
손글씨 워드마크 + 코랄 스탬프 버튼). 색상·타이포·컴포넌트 규칙은
[`DESIGN.md`](DESIGN.md)에 정리되어 있으니, UI를 건드릴 때는 먼저 확인해 주세요.

## 알려진 제한사항 / 다음 할 일

- 작업 삭제 시 확인 절차 없음, 저장 안 한 변경사항 경고 없음
- 실행 실패(잘못된 경로 등)가 사용자에게 표시되지 않음
- 실행 취소(중지) 버튼 없음, 루틴 세트 하나만 지원

전체 목록과 우선순위는 [`TODO.md`](TODO.md)를 참고하세요.

## 참고 문서

- [`CLAUDE.md`](CLAUDE.md) — 코드베이스 아키텍처/컨벤션 (AI 코딩 어시스턴트용)
- [`PRODUCT.md`](PRODUCT.md) — 제품 정의 (사용자, 목적, 포지셔닝)
- [`DESIGN.md`](DESIGN.md) — 디자인 시스템 명세
- [`TODO.md`](TODO.md) — 기능/UX 개선 후보 목록
