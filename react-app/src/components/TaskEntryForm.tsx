import { useState } from "react";
import { FolderOpen } from "lucide-react";
import type { Task, TaskType } from "../types";

interface TaskEntryFormProps {
  initialValues?: Task;
  onSubmit: (task: Task) => void;
  onCancel?: () => void;
  submitLabel: React.ReactNode;
  variant?: "add" | "edit";
}

export default function TaskEntryForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel,
  variant = "add",
}: TaskEntryFormProps) {
  const [task, setTask] = useState<Task>(
    initialValues || { type: "browser", title: "", value: "", delay: 1 }
  );


  const selectFile = async () => {
    const path = await window.electronAPI.selectFile();
    if (path) {
      setTask((prev) => {
        const newTask = { ...prev, value: path, type: "program" as TaskType };
        // 파일 이름을 타이틀로 제안 (기존 타이틀이 없을 때만)
        if (!prev.title) {
          const fileName = path.split(/[\\/]/).pop();
          if (fileName) newTask.title = fileName;
        }
        return newTask;
      });
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!task.value.trim()) return;
    onSubmit(task);
    if (variant === "add") {
      setTask({ type: "browser", title: "", value: "", delay: 1 });
    }
  };

  if (variant === "edit") {
    /* Inline Edit Mode Layout */
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 pb-4">
          <div className="inline-flex bg-gray-100 rounded-full p-1 shadow-inner">
            <button
              type="button"
              onClick={() => setTask((prev) => ({ ...prev, type: "browser" }))}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                task.type === "browser" ? "bg-white text-[#0082B2] shadow-sm" : "text-gray-500"
              }`}
            >
              🌐 웹
            </button>
            <button
              type="button"
              onClick={() => setTask((prev) => ({ ...prev, type: "program" }))}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                task.type === "program" ? "bg-white text-[#0082B2] shadow-sm" : "text-gray-500"
              }`}
            >
              💻 앱
            </button>
          </div>
          <div className="flex-1 min-w-[200px]">
            <input
              value={task.title}
              onChange={(e) => setTask((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="이름 (ex: GitLab)"
              className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm font-bold focus:outline-none focus:border-[#0082B2] focus:ring-2 focus:ring-[#0082B2]/10"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
          <div className="flex-1 w-full relative">
            <input
              value={task.value}
              onChange={(e) => setTask((prev) => ({ ...prev, value: e.target.value }))}
              placeholder={task.type === "browser" ? "URL 입력" : "경로 입력"}
              className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-[#0082B2] pr-10"
            />
            {task.type === "program" && (
              <button
                type="button"
                onClick={selectFile}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-[#0082B2]"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="number"
                min="0"
                value={task.delay}
                onChange={(e) => setTask((prev) => ({ ...prev, delay: Number(e.target.value) }))}
                className="w-20 bg-gray-50 border border-gray-200 rounded-full px-3 py-2.5 text-sm font-bold text-center focus:outline-none focus:border-[#0082B2]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">초</span>
            </div>
            <div className="flex gap-2 ml-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!task.value.trim()}
                className="p-2.5 bg-[#0082B2] text-white rounded-full hover:bg-[#006e96] shadow-sm active:scale-95 disabled:opacity-30 transition-all"
                title="저장"
              >
                {submitLabel}
              </button>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="p-2.5 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 shadow-sm active:scale-95 transition-all"
                  title="취소"
                >
                  <span className="w-5 h-5 flex items-center justify-center font-bold">×</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* Standard Add Mode Layout */
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="inline-flex bg-gray-100 rounded-full p-1.5 w-max shadow-inner">
        <button
          type="button"
          onClick={() => setTask((prev) => ({ ...prev, type: "browser" }))}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
            task.type === "browser"
              ? "bg-white text-[#0082B2] shadow-sm transform scale-100"
              : "text-gray-500 hover:text-gray-700 hover:bg-white/50 scale-95 opacity-80"
          }`}
        >
          🌐 웹 사이트
        </button>
        <button
          type="button"
          onClick={() => setTask((prev) => ({ ...prev, type: "program" }))}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
            task.type === "program"
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
            value={task.title}
            onChange={(e) => setTask((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="이름 (ex: GitLab)"
            className="w-full bg-gray-50 border-2 border-transparent hover:border-gray-200 rounded-full px-6 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#0082B2] focus:ring-4 focus:ring-[#0082B2]/10 transition-all font-bold tracking-tight shadow-sm"
          />
        </div>

        <div className="md:col-span-5 relative">
          <input
            value={task.value}
            onChange={(e) => setTask((prev) => ({ ...prev, value: e.target.value }))}
            placeholder={task.type === "browser" ? "주소 입력 (ex: https://naver.com)" : "프로그램(.exe) 경로"}
            className="w-full bg-gray-50 border-2 border-transparent hover:border-gray-200 rounded-full px-6 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#0082B2] focus:ring-4 focus:ring-[#0082B2]/10 transition-all font-bold tracking-tight shadow-sm pr-14"
          />
          {task.type === "program" && (
            <button
              type="button"
              onClick={selectFile}
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
            value={task.delay}
            onChange={(e) => setTask((prev) => ({ ...prev, delay: Number(e.target.value) }))}
            className="w-full bg-gray-50 border-2 border-transparent hover:border-gray-200 rounded-full pl-6 pr-12 py-4 text-gray-900 text-center focus:outline-none focus:bg-white focus:border-[#0082B2] focus:ring-4 focus:ring-[#0082B2]/10 transition-all font-bold tracking-tight shadow-sm"
          />
          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">초</div>
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={!task.value.trim()}
            className="w-full flex items-center justify-center gap-2 bg-[#E54D26] hover:bg-[#D44015] text-white rounded-full py-4 font-bold text-lg transition-all disabled:opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(229,77,38,0.3)] hover:-translate-y-1 active:scale-95 border-b-2 border-transparent hover:border-black/10"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
