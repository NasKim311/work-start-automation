import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import type { Task, ElectronAPI } from "./types";

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}


function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [autoStartEnabled, setAutoStartEnabled] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const loadedTasks = await window.electronAPI.loadConfig();
        setTasks(loadedTasks);

        // 윈도우 시작 시 자동 실행된 경우 즉시 작업 시작
        const isAuto = await window.electronAPI.isAutoStart();
        if (isAuto && loadedTasks.length > 0) {
          window.electronAPI.runTasks(loadedTasks);
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
      await window.electronAPI.saveConfig(tasks);
      setTimeout(() => setIsSaving(false), 500);
    } catch (error) {
      console.error("설정 저장 실패:", error);
      alert("설정을 저장할 수 없습니다. 다시 시도해 주세요.");
      setIsSaving(false);
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

  return (
    <div className="min-h-screen font-sans pb-16">
      {/* Hero Header Area (Morning Note) */}
      <div className="mn-hero pt-16 pb-24 px-6 flex flex-col items-center text-center">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#FBF6EC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12.5l2.5 2.5L16 9.5" />
        </svg>
        <h1 className="mn-title text-6xl mb-2 leading-none">DeskReady</h1>
        <p className="max-w-lg mx-auto leading-relaxed font-semibold" style={{ color: "#C9BFA0" }}>
          매일 아침 반복되는 업무 준비,<br />단 한 번의 클릭으로 내 책상에 완벽하게 세팅하세요.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-14 relative z-20 space-y-6">
        {/* Action Bar */}
        <div className="mn-card p-6 sm:p-8">
          <span className="mn-label mb-4">오늘의 설정</span>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold" style={{ color: "#5B5340" }}>윈도우 시작 시 자동 실행</span>
              <button onClick={toggleAutoStart} className="mn-toggle-track">
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
                onClick={() => window.electronAPI.runTasks(tasks)}
                className="mn-stamp-primary px-7 py-2.5 flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                출근 시작하기
              </button>
            </div>
          </div>
        </div>

        {/* Curation Form Card */}
        <div className="mn-card p-6 sm:p-8">
          <span className="mn-label mb-5">새로운 작업 추가</span>
          <TaskForm onAdd={(task) => setTasks((prev) => [...prev, task])} />
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
              onRemove={(i) =>
                setTasks((prev) => prev.filter((_, idx) => idx !== i))
              }
              onUpdate={(i, updatedTask) =>
                setTasks((prev) =>
                  prev.map((t, idx) => (idx === i ? updatedTask : t))
                )
              }
              onMove={(from, to) => {
                const copy = [...tasks];
                [copy[from], copy[to]] = [copy[to], copy[from]];
                setTasks(copy);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;