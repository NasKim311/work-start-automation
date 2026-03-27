import { useState } from "react";
import { FolderOpen } from "lucide-react";
import type { Task, TaskType } from "../types";

export default function TaskForm({ onAdd }: { onAdd: (task: Task) => void }) {
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [type, setType] = useState<TaskType>("browser");
  const [delay, setDelay] = useState(1);

  const selectFile = async () => {
    const path = await window.electronAPI.selectFile();
    if (path) {
      setValue(path);
      setType("program");
      // 파일 이름을 기본 타이틀로 제안 (경로의 마지막 부분)
      const fileName = path.split(/[\\/]/).pop();
      if (fileName && !title) setTitle(fileName);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!value.trim()) return;
    onAdd({ type, title, value, delay });
    setTitle("");
    setValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Category Selection Pill */}
      <div className="inline-flex bg-gray-100 rounded-full p-1.5 w-max shadow-inner">
        <button
          type="button"
          onClick={() => setType("browser")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
            type === "browser"
              ? "bg-white text-[#0082B2] shadow-sm transform scale-100"
              : "text-gray-500 hover:text-gray-700 hover:bg-white/50 scale-95 opacity-80"
          }`}
        >
          🌐 웹 사이트
        </button>
        <button
          type="button"
          onClick={() => setType("program")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
            type === "program"
              ? "bg-white text-[#0082B2] shadow-sm transform scale-100"
              : "text-gray-500 hover:text-gray-700 hover:bg-white/50 scale-95 opacity-80"
          }`}
        >
          💻 프로그램
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="이름 (ex: GitLab)"
            className="w-full bg-gray-50 border-2 border-transparent hover:border-gray-200 rounded-full px-6 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#0082B2] focus:ring-4 focus:ring-[#0082B2]/10 transition-all font-bold tracking-tight shadow-sm"
          />
        </div>

        <div className="md:col-span-5 relative">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={type === "browser" ? "주소 입력 (ex: https://naver.com)" : "실행할 프로그램(.exe) 경로"}
            className="w-full bg-gray-50 border-2 border-transparent hover:border-gray-200 rounded-full px-6 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#0082B2] focus:ring-4 focus:ring-[#0082B2]/10 transition-all font-bold tracking-tight shadow-sm pr-14"
          />
          {type === "program" && (
            <button
              type="button"
              onClick={selectFile}
              title="파일 찾아보기"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 text-gray-500 hover:text-[#0082B2] bg-white rounded-full transition-colors shadow-sm border border-gray-100 hover:border-[#0082B2]/30 hover:scale-105 active:scale-95"
            >
              <FolderOpen className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="md:col-span-2 relative">
          <input
            type="number"
            min="0"
            value={delay}
            onChange={(e) => setDelay(Number(e.target.value))}
            placeholder="대기시간"
            className="w-full bg-gray-50 border-2 border-transparent hover:border-gray-200 rounded-full pl-6 pr-12 py-4 text-gray-900 text-center focus:outline-none focus:bg-white focus:border-[#0082B2] focus:ring-4 focus:ring-[#0082B2]/10 transition-all font-bold tracking-tight shadow-sm"
          />
          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
            초
          </div>
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={!value.trim()}
            className="w-full flex items-center justify-center gap-2 bg-[#E54D26] hover:bg-[#D44015] text-white rounded-full py-4 font-bold text-lg transition-all disabled:opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(229,77,38,0.3)] hover:-translate-y-1 active:scale-95 border-b-2 border-transparent hover:border-black/10"
          >
            ➕ 담기
          </button>
        </div>
      </div>
    </form>
  );
}