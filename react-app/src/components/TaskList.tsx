import type { Task } from "../types";
import { Globe, MonitorPlay, ArrowUp, ArrowDown, Trash2, GripVertical } from "lucide-react";

export default function TaskList({
  tasks,
  onRemove,
  onMove,
}: {
  tasks: Task[];
  onRemove: (i: number) => void;
  onMove: (from: number, to: number) => void;
}) {
  return (
    <div className="space-y-3">
      {tasks.map((task, i) => (
        <div
          key={i}
          className="group flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/50 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 gap-4 transition-all hover:bg-slate-900/80 shadow-sm"
        >
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="cursor-grab active:cursor-grabbing text-slate-700 hover:text-slate-500 shrink-0 hidden sm:block">
              <GripVertical className="w-5 h-5" />
            </div>
            
            <div className={`shrink-0 p-3 rounded-xl border ${
              task.type === "browser" 
                ? "bg-blue-500/10 border-blue-500/20 text-blue-400" 
                : "bg-purple-500/10 border-purple-500/20 text-purple-400"
            }`}>
              {task.type === "browser" ? (
                <Globe className="w-5 h-5" />
              ) : (
                <MonitorPlay className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-slate-200 font-medium truncate" title={task.value}>
                {task.value}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium tracking-wide border ${
                  task.type === "browser" 
                    ? "bg-blue-500/5 text-blue-400 border-blue-500/10" 
                    : "bg-purple-500/5 text-purple-400 border-purple-500/10"
                }`}>
                  {task.type === "browser" ? "웹 브라우저" : "프로그램"}
                </span>
                <span className="text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 font-mono tracking-wider">
                  대기: {task.delay}초
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:shrink-0 justify-end">
            <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-1 shadow-inner mr-2">
              <button
                onClick={() => onMove(i, i - 1)}
                disabled={i === 0}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-md disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors"
                title="위로 이동"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <div className="w-px h-3.5 bg-slate-800 mx-1"></div>
              <button
                onClick={() => onMove(i, i + 1)}
                disabled={i === tasks.length - 1}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-md disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors"
                title="아래로 이동"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => onRemove(i)}
              className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors border border-transparent hover:border-red-500/20"
              title="삭제"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}