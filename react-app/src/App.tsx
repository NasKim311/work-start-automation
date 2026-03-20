import { useEffect, useState } from "react";
import { Rocket, Power } from "lucide-react";
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
    setTimeout(() => setIsSaving(false), 500); // Visual feedback
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden text-slate-50">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-4xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-8 space-y-8 z-10 transition-all">
        
        <header className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/10 p-3 rounded-2xl border border-blue-500/20 shadow-inner">
              <Rocket className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                업무 자동화
              </h1>
              <p className="text-slate-400 text-sm mt-1">클릭 한 번으로 하루 일과 시작</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 border ${
                isSaving 
                  ? 'bg-green-500/20 border-green-500/30 text-green-400' 
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 hover:text-white shadow-sm'
              }`}
            >
              {isSaving ? '저장 완료!' : '설정 저장'}
            </button>
            <button
              onClick={() => window.electronAPI.runTasks(tasks)}
              className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-900/40 transition-all duration-300 hover:shadow-blue-900/60 active:scale-95 border border-blue-500/50"
            >
              <Power className="w-5 h-5 group-hover:animate-pulse" />
              출근 시작
            </button>
          </div>
        </header>

        <TaskForm onAdd={(task) => setTasks((prev) => [...prev, task])} />

        <div className="bg-slate-950/50 rounded-2xl border border-slate-800/80 p-6 min-h-[300px] shadow-inner">
          <h2 className="text-lg font-medium text-slate-300 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]"></span>
            실행 대기열 <span className="text-slate-500 text-sm ml-2 font-mono">({tasks.length})</span>
          </h2>
          
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 bg-slate-900/30 rounded-xl border border-dashed border-slate-700/50">
              <Rocket className="w-12 h-12 mb-4 opacity-20" />
              <p>아직 등록된 자동화 작업이 없습니다.</p>
              <p className="text-sm mt-1 opacity-70">위 폼에서 브라우저 URL이나 프로그램을 추가해보세요.</p>
            </div>
          ) : (
            <TaskList
              tasks={tasks}
              onRemove={(i) =>
                setTasks((prev) => prev.filter((_, idx) => idx !== i))
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