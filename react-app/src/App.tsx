import { useEffect, useState } from "react";
import { Play, Square, Plus, Check, X, Download, Upload } from "lucide-react";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import type { Task, Profile, ElectronAPI, AutoStartByDay } from "./types";
import { reorderTasks } from "./utils";

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

// 요일 표시 순서(월~일)와 라벨. 값(키)은 JS Date.getDay()와 동일한 인덱스
// (0=일 ~ 6=토)라서, 실제 자동실행 시점엔 new Date().getDay()로 바로 조회한다.
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const WEEKDAY_LABELS: Record<number, string> = {
  0: "일", 1: "월", 2: "화", 3: "수", 4: "목", 5: "금", 6: "토",
};

function App() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState("");
  const [autoStartByDay, setAutoStartByDay] = useState<AutoStartByDay>({});
  const [isSaving, setIsSaving] = useState(false);
  const [autoStartEnabled, setAutoStartEnabled] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runningTaskTitle, setRunningTaskTitle] = useState<string | null>(null);
  const [newProfileDraft, setNewProfileDraft] = useState<string | null>(null);
  const [isRenamingProfile, setIsRenamingProfile] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");

  const activeProfile = profiles.find((p) => p.id === activeProfileId);
  const tasks = activeProfile?.tasks ?? [];
  // 자동실행에서 제외된(enabled === false) 작업은 실제로 실행되지 않으므로
  // 소요시간/실행 가능 여부 판단에서도 제외한다 (main.js의 run-tasks와 동일 기준)
  const runnableTasks = tasks.filter((t) => t.enabled !== false);
  const totalDelaySeconds = runnableTasks.reduce((sum, t) => sum + (t.delay || 0), 0);

  const updateActiveTasks = (updater: (tasks: Task[]) => Task[]) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === activeProfileId ? { ...p, tasks: updater(p.tasks) } : p))
    );
    setHasUnsavedChanges(true);
  };

  useEffect(() => {
    if (!activeProfileId) return; // 초기 로드 전에는 알릴 상태가 없음
    try {
      window.electronAPI.notifyDirtyState(
        { profiles, activeProfileId, autoStartByDay },
        hasUnsavedChanges
      );
    } catch (error) {
      console.error("변경사항 상태 전달 실패:", error);
    }
  }, [profiles, activeProfileId, autoStartByDay, hasUnsavedChanges]);

  useEffect(() => {
    const unsubscribe = window.electronAPI.onTaskError(({ task, message }) => {
      alert(`"${task.title || task.value}" 실행에 실패했습니다.\n${message}`);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = window.electronAPI.onConfigLoadWarning(({ recovered, backupPath }) => {
      if (recovered) {
        alert(
          "설정 파일이 손상되어 있었지만, 직전 백업본으로 자동 복구했습니다.\n지금 보이는 내용이 맞는지 확인해보세요."
        );
      } else {
        alert(
          "설정 파일이 손상되어 백업본으로도 복구하지 못해 기본 설정으로 시작합니다.\n" +
            (backupPath
              ? `손상된 원본은 다음 위치에 보존해두었습니다:\n${backupPath}`
              : "손상된 원본을 별도로 보존하는 데도 실패했습니다.")
        );
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribeStarted = window.electronAPI.onTaskStarted(({ task }) => {
      setRunningTaskTitle(task.title || task.value);
    });
    const unsubscribeFinished = window.electronAPI.onRunFinished(() => {
      setIsRunning(false);
      setRunningTaskTitle(null);
    });
    return () => {
      unsubscribeStarted();
      unsubscribeFinished();
    };
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const config = await window.electronAPI.loadConfig();
        setProfiles(config.profiles);
        setActiveProfileId(config.activeProfileId);
        setAutoStartByDay(config.autoStartByDay);

        // 윈도우 시작 시 자동 실행된 경우, 오늘 요일에 지정된 세트를 즉시 시작
        const isAuto = await window.electronAPI.isAutoStart();
        if (isAuto) {
          const todaysProfileId = config.autoStartByDay[new Date().getDay()];
          const autoStartProfile = todaysProfileId
            ? config.profiles.find((p) => p.id === todaysProfileId)
            : undefined;
          if (autoStartProfile && autoStartProfile.tasks.length > 0) {
            // 부팅 시 조용히 실행돼서 사용자가 인지 못 하는 문제 방지 — OS 알림으로 시작을 알림
            try {
              new Notification("DeskReady", {
                body: `"${autoStartProfile.name}" 세트를 자동으로 시작합니다 (${autoStartProfile.tasks.length}개 작업).`,
              });
            } catch (error) {
              console.error("자동 실행 알림 표시 실패:", error);
            }
            window.electronAPI.runTasks(autoStartProfile.tasks);
          }
        }

        const autoStartStatus = await window.electronAPI.getAutoStart();
        setAutoStartEnabled(autoStartStatus);
      } catch (error) {
        console.error("초기화 오류:", error);
      }
    };
    init();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await window.electronAPI.saveConfig({ profiles, activeProfileId, autoStartByDay });
      setHasUnsavedChanges(false);
      setTimeout(() => setIsSaving(false), 500);
    } catch (error) {
      console.error("설정 저장 실패:", error);
      alert("설정을 저장할 수 없습니다. 다시 시도해 주세요.");
      setIsSaving(false);
    }
  };

  const handleStop = async () => {
    try {
      await window.electronAPI.stopTasks();
    } catch (error) {
      console.error("실행 중지 실패:", error);
    } finally {
      setIsRunning(false);
      setRunningTaskTitle(null);
    }
  };

  const toggleAutoStart = async () => {
    try {
      const newValue = !autoStartEnabled;
      await window.electronAPI.setAutoStart(newValue);
      setAutoStartEnabled(newValue);
    } catch (error) {
      console.error("자동 실행 설정 실패:", error);
      alert("자동 실행 설정을 변경할 수 없습니다. 앱을 재시작해 보세요.");
    }
  };

  // Electron BrowserWindow는 window.prompt()를 지원하지 않아(호출 시 예외 발생)
  // 세트 추가/이름 변경 모두 인라인 입력창으로 처리한다.
  const confirmAddProfile = () => {
    const name = newProfileDraft?.trim();
    if (!name) {
      setNewProfileDraft(null);
      return;
    }
    const id = crypto.randomUUID();
    setProfiles((prev) => [...prev, { id, name, tasks: [] }]);
    setActiveProfileId(id);
    setHasUnsavedChanges(true);
    setNewProfileDraft(null);
  };

  const startRenameProfile = () => {
    if (!activeProfile) return;
    setRenameDraft(activeProfile.name);
    setIsRenamingProfile(true);
  };

  const confirmRenameProfile = () => {
    const name = renameDraft.trim();
    if (name) {
      setProfiles((prev) =>
        prev.map((p) => (p.id === activeProfileId ? { ...p, name } : p))
      );
      setHasUnsavedChanges(true);
    }
    setIsRenamingProfile(false);
  };

  const handleExport = async () => {
    try {
      const ok = await window.electronAPI.exportConfig({
        profiles,
        activeProfileId,
        autoStartByDay,
      });
      if (ok) alert("설정을 내보냈습니다.");
    } catch (error) {
      console.error("설정 내보내기 실패:", error);
      alert("설정을 내보낼 수 없습니다.");
    }
  };

  const handleImport = async () => {
    try {
      const imported = await window.electronAPI.importConfig();
      if (!imported) return;
      if (!window.confirm("가져온 설정으로 지금 열려있는 모든 루틴 세트를 덮어쓸까요?")) {
        return;
      }
      setProfiles(imported.profiles);
      setActiveProfileId(imported.activeProfileId);
      setAutoStartByDay(imported.autoStartByDay);
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error("설정 가져오기 실패:", error);
      alert("설정을 가져올 수 없습니다.");
    }
  };

  const deleteActiveProfile = () => {
    if (!activeProfile || profiles.length <= 1) return;
    if (
      !window.confirm(
        `"${activeProfile.name}" 세트를 삭제할까요? 안에 담긴 작업 ${activeProfile.tasks.length}개도 함께 삭제됩니다.`
      )
    ) {
      return;
    }
    const remaining = profiles.filter((p) => p.id !== activeProfileId);
    setProfiles(remaining);
    setActiveProfileId(remaining[0].id);
    // 삭제된 세트가 요일별 자동실행에 지정돼 있었다면, 남은 첫 세트로 이관
    setAutoStartByDay((prev) => {
      const next = { ...prev };
      for (const day of Object.keys(next)) {
        if (next[Number(day)] === activeProfileId) {
          next[Number(day)] = remaining[0].id;
        }
      }
      return next;
    });
    setHasUnsavedChanges(true);
  };

  return (
    <div className="min-h-screen font-sans pb-16">
      {/* Hero Header Area (Morning Note) */}
      <div className="mn-hero pt-16 pb-24 px-6 flex flex-col items-center text-center">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#FBF6EC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
          <path d="M6 11 L17 11 L16 19 Q16 20 15 20 L8 20 Q7 20 7 19 Z" />
          <path d="M17 12.3 Q20 12.3 20 15 Q20 17.7 17 17.7" />
          <path d="M14 8.2 L15.5 9.7 L19 5.7" stroke="#C9634A" />
        </svg>
        <h1 className="mn-title text-6xl mb-2 leading-none">DeskReady</h1>
        <p className="max-w-lg mx-auto leading-relaxed font-semibold" style={{ color: "#C9BFA0" }}>
          매일 아침 반복되는 업무 준비,<br />단 한 번의 클릭으로 내 책상에 완벽하게 세팅하세요.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-14 relative z-20 space-y-6">
        {/* Profile Switcher */}
        <div className="mn-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="mn-label">루틴 세트</span>
            <div className="flex items-center gap-1">
              <button onClick={handleImport} className="mn-icon-btn p-2" title="설정 가져오기">
                <Upload className="w-4 h-4" />
              </button>
              <button onClick={handleExport} className="mn-icon-btn p-2" title="설정 내보내기">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          {isRenamingProfile ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={renameDraft}
                onChange={(e) => setRenameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmRenameProfile();
                  if (e.key === "Escape") setIsRenamingProfile(false);
                }}
                className="mn-underline-input"
                placeholder="세트 이름"
              />
              <button onClick={confirmRenameProfile} className="mn-icon-btn p-2" title="확인">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setIsRenamingProfile(false)} className="mn-icon-btn p-2" title="취소">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveProfileId(p.id)}
                  className={`mn-type-tab ${p.id === activeProfileId ? "active" : ""}`}
                >
                  {p.name}
                </button>
              ))}
              {newProfileDraft !== null ? (
                <div className="flex items-center gap-1">
                  <input
                    autoFocus
                    value={newProfileDraft}
                    onChange={(e) => setNewProfileDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmAddProfile();
                      if (e.key === "Escape") setNewProfileDraft(null);
                    }}
                    className="mn-underline-input"
                    placeholder="세트 이름 (ex: 재택용)"
                    style={{ width: 140 }}
                  />
                  <button onClick={confirmAddProfile} className="mn-icon-btn p-2" title="추가">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setNewProfileDraft(null)} className="mn-icon-btn p-2" title="취소">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button onClick={() => setNewProfileDraft("")} className="mn-icon-btn p-2" title="새 세트 추가">
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
          {activeProfile && !isRenamingProfile && (
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs font-bold" style={{ color: "#A79C7F" }}>
              <button onClick={startRenameProfile} className="underline">이름 변경</button>
              {profiles.length > 1 && (
                <button onClick={deleteActiveProfile} className="underline" style={{ color: "#C9634A" }}>
                  이 세트 삭제
                </button>
              )}
            </div>
          )}
        </div>

        {/* Weekday Auto-start Assignment */}
        <div className="mn-card p-4 sm:p-6">
          <span className="mn-label">요일별 자동실행 설정</span>
          <p className="text-xs mt-1 mb-4" style={{ color: "#A79C7F" }}>
            윈도우 시작 시 자동 실행이 켜져 있으면, 그날 요일에 지정된 세트가 실행돼요.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            {WEEKDAY_ORDER.map((day) => (
              <div key={day} className="flex items-center gap-3">
                <span
                  className="text-sm font-bold w-4 text-center"
                  style={{ color: "#5B5340" }}
                >
                  {WEEKDAY_LABELS[day]}
                </span>
                <select
                  value={autoStartByDay[day] ?? ""}
                  onChange={(e) => {
                    const value = e.target.value || null;
                    setAutoStartByDay((prev) => ({ ...prev, [day]: value }));
                    setHasUnsavedChanges(true);
                  }}
                  className="mn-underline-input"
                >
                  <option value="">안 함</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Action Bar */}
        <div className="mn-card p-6 sm:p-8">
          <span className="mn-label mb-4">오늘의 설정</span>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold" style={{ color: "#5B5340" }}>윈도우 시작 시 자동 실행</span>
              <button onClick={toggleAutoStart} className={`mn-toggle-track ${autoStartEnabled ? "on" : ""}`}>
                <span
                  className="mn-toggle-dot"
                  style={{ left: autoStartEnabled ? 22 : 3 }}
                />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handleSave} className="mn-stamp-secondary px-5 py-2.5">
                {isSaving ? '저장 완료' : '설정 저장'}
              </button>
              <button
                onClick={() => {
                  setIsRunning(true);
                  setRunningTaskTitle(null);
                  window.electronAPI.runTasks(tasks);
                }}
                disabled={isRunning || runnableTasks.length === 0}
                className="mn-stamp-primary px-7 py-2.5 flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                {isRunning
                  ? runningTaskTitle
                    ? `실행 중: ${runningTaskTitle}`
                    : "실행 준비 중..."
                  : "출근 시작하기"}
              </button>
              {isRunning && (
                <button
                  onClick={handleStop}
                  className="mn-stamp-secondary px-4 py-2.5 flex items-center gap-2"
                  title="남은 작업 취소"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  중지
                </button>
              )}
            </div>
          </div>
          {runnableTasks.length > 0 && (
            <p className="text-xs font-bold text-right mt-2" style={{ color: "#A79C7F" }}>
              총 예상 소요시간 {totalDelaySeconds}초
            </p>
          )}
        </div>

        {/* Curation Form Card */}
        <div className="mn-card p-6 sm:p-8">
          <span className="mn-label mb-5">새로운 작업 추가</span>
          <TaskForm
            onAdd={(task) => {
              updateActiveTasks((prev) => [...prev, task]);
            }}
          />
        </div>

        {/* Task List Section */}
        <div className="mn-card p-6 sm:p-8">
          <div className="flex items-center justify-between mb-2">
            <span className="mn-label">나의 데스크 루틴 리스트</span>
            <span className="text-xs font-bold" style={{ color: "#B9AC8C" }}>총 {tasks.length}개</span>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-10">
              <p className="font-bold" style={{ color: "#8A8065" }}>아직 큐레이션된 작업이 없어요.</p>
              <p className="mt-1 text-sm" style={{ color: "#A79C7F" }}>위 폼에서 매일 사용하는 웹사이트나 프로그램을 추가해 보세요!</p>
            </div>
          ) : (
            <TaskList
              tasks={tasks}
              onRemove={(i) => {
                updateActiveTasks((prev) => prev.filter((_, idx) => idx !== i));
              }}
              onUpdate={(i, updatedTask) => {
                updateActiveTasks((prev) =>
                  prev.map((t, idx) => (idx === i ? updatedTask : t))
                );
              }}
              onMove={(from, to) => {
                updateActiveTasks((prev) => reorderTasks(prev, from, to));
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
