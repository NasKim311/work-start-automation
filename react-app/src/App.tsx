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

  useEffect(() => {
    window.electronAPI.loadConfig().then(setTasks);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    await window.electronAPI.saveConfig(tasks);
    setTimeout(() => setIsSaving(false), 500);
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] font-sans pb-12">
      {/* Hero Header Area (Jinjja Seoul Style) */}
      <div className="bg-[#0082B2] text-white pt-16 pb-24 px-6 relative overflow-hidden flex flex-col items-center text-center rounded-b-[40px] shadow-lg">
        {/* Background decorative elements */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>
        <div className="absolute top-20 -right-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        
        <div className="z-10 w-full max-w-3xl">
          <div className="inline-flex items-center justify-center bg-white/20 backdrop-blur-sm p-3 rounded-2xl mb-6 shadow-sm">
            <span className="text-4xl leading-none">⚡</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            DeskReady
          </h1>
          <p className="text-blue-100 text-lg md:text-xl font-medium max-w-lg mx-auto leading-relaxed">
            매일 아침 반복되는 업무 준비,<br/>단 한 번의 클릭으로 내 책상에 완벽하게 세팅하세요.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-10 relative z-20 space-y-6">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-end items-center gap-3">
          <button
            onClick={handleSave}
            className={`px-6 py-3.5 rounded-full font-bold transition-all duration-300 shadow-sm ${
              isSaving 
                ? 'bg-green-100 text-green-700' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:-translate-y-0.5'
            }`}
          >
            {isSaving ? '✅ 저장 완료' : '💾 설정 저장'}
          </button>
          <button
            onClick={() => window.electronAPI.runTasks(tasks)}
            className="flex items-center gap-2 bg-[#E54D26] hover:bg-[#D44015] text-white px-8 py-3.5 rounded-full font-bold shadow-[0_4px_14px_rgba(229,77,38,0.3)] transition-all duration-300 hover:-translate-y-1 active:scale-95"
          >
            <Play className="w-5 h-5 fill-current" />
            출근 시작하기
          </button>
        </div>

        {/* Curation Form Card */}
        <div className="bg-white rounded-[32px] shadow-sm p-6 sm:p-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 tracking-tight">
            <span>✨</span> 새로운 작업 큐레이션
          </h2>
          <TaskForm onAdd={(task) => setTasks((prev) => [...prev, task])} />
        </div>

        {/* Task List Section */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-5 px-2">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span>💻</span> 나의 데스크 루틴 리스트
            </h2>
            <span className="bg-[#0082B2]/10 text-[#0082B2] px-3.5 py-1.5 rounded-full text-sm font-bold">
              총 {tasks.length}개
            </span>
          </div>
          
          {tasks.length === 0 ? (
            <div className="bg-white rounded-[32px] p-12 text-center border border-gray-100 shadow-sm flex flex-col items-center">
              <span className="text-6xl mb-4 opacity-50 block">🧐</span>
              <p className="text-gray-500 font-bold text-lg">아직 큐레이션된 작업이 없어요.</p>
              <p className="text-gray-400 mt-2 font-medium">위 폼에서 매일 사용하는 웹사이트나 프로그램을 추가해 보세요!</p>
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