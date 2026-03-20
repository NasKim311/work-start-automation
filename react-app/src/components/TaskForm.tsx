import { useState } from "react";
import { Plus, FolderOpen, Globe, MonitorPlay, Timer } from "lucide-react";
import type { Task, TaskType } from "../types";

export default function TaskForm({ onAdd }: { onAdd: (task: Task) => void }) {
  const [value, setValue] = useState("");
  const [type, setType] = useState<TaskType>("browser");
  const [delay, setDelay] = useState(1);

  const selectFile = async () => {
    const path = await window.electronAPI.selectFile();
    if (path) {
      setValue(path);
      setType("program");
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!value.trim()) return;
    onAdd({ type, value, delay });
    setValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row gap-3 items-center shadow-inner">
      <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800 shrink-0 w-full md:w-auto">
        <button
          type="button"
          onClick={() => setType("browser")}
          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            type === "browser"
              ? "bg-blue-500/20 text-blue-400 shadow-sm border border-blue-500/20"
              : "text-slate-400 hover:text-slate-200 border border-transparent"
          }`}
        >
          <Globe className="w-4 h-4" /> 웹 URL
        </button>
        <button
          type="button"
          onClick={() => setType("program")}
          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            type === "program"
              ? "bg-purple-500/20 text-purple-400 shadow-sm border border-purple-500/20"
              : "text-slate-400 hover:text-slate-200 border border-transparent"
          }`}
        >
          <MonitorPlay className="w-4 h-4" /> 프로그램
        </button>
      </div>

      <div className="flex-1 w-full relative group">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={type === "browser" ? "https://example.com" : "C:\\Program Files\\app.exe"}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all pr-12 shadow-inner"
        />
        {type === "program" && (
          <button
            type="button"
            onClick={selectFile}
            title="파일 찾아보기"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-blue-400 bg-slate-900 rounded-lg transition-colors border border-slate-800 shadow-sm"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex gap-3 w-full md:w-auto shrink-0">
        <div className="relative flex-1 md:w-32">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            <Timer className="w-4 h-4" />
          </div>
          <input
            type="number"
            min="0"
            value={delay}
            onChange={(e) => setDelay(Number(e.target.value))}
            placeholder="지연(초)"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-3 text-slate-200 text-center focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-mono shadow-inner"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 text-xs font-medium">
            초
          </div>
        </div>

        <button
          type="submit"
          disabled={!value.trim()}
          className="shrink-0 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl px-6 py-3 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700 shadow-sm"
        >
          <Plus className="w-5 h-5" /> 추가
        </button>
      </div>
    </form>
  );
}