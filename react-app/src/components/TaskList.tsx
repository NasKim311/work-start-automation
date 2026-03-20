import type { Task } from "../types";
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";

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
    <div className="space-y-4">
      {tasks.map((task, i) => (
        <div
          key={i}
          className="group flex flex-col sm:flex-row sm:items-center justify-between bg-white border-2 border-transparent hover:border-gray-100 rounded-[28px] p-5 gap-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_24px_rgba(0,0,0,0.06)] shadow-sm"
        >
          <div className="flex items-center gap-5 min-w-0 flex-1">
            <div className="text-4xl shrink-0 p-3 bg-gray-50 rounded-3xl shadow-inner group-hover:scale-110 transition-transform duration-300">
              {task.type === "browser" ? "🌐" : "💻"}
            </div>

            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[12.px] tracking-tight px-3 py-1 rounded-full font-bold uppercase ${
                  task.type === "browser" 
                    ? "bg-[#0082B2]/10 text-[#0082B2]" 
                    : "bg-[#E54D26]/10 text-[#E54D26]"
                }`}>
                  {task.type === "browser" ? "웹사이트" : "프로그램"}
                </span>
                <span className="text-[12px] text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-bold tracking-tight">
                  ⏱ 대기 {task.delay}초
                </span>
              </div>
              
              <p className="text-gray-900 font-bold text-[17px] truncate tracking-tight" title={task.value}>
                {task.value}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:shrink-0 justify-end mt-2 sm:mt-0">
            <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1.5 border border-gray-100 shadow-inner">
              <button
                onClick={() => onMove(i, i - 1)}
                disabled={i === 0}
                className="p-2 text-gray-400 hover:text-[#0082B2] hover:bg-white rounded-full disabled:opacity-30 transition-all shadow-sm disabled:shadow-none hover:scale-105 active:scale-95"
                title="위로 올리기"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
              <button
                onClick={() => onMove(i, i + 1)}
                disabled={i === tasks.length - 1}
                className="p-2 text-gray-400 hover:text-[#0082B2] hover:bg-white rounded-full disabled:opacity-30 transition-all shadow-sm disabled:shadow-none hover:scale-105 active:scale-95"
                title="아래로 내리기"
              >
                <ArrowDown className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => onRemove(i)}
              className="p-3 text-gray-400 hover:text-white hover:bg-[#E54D26] rounded-full transition-all ml-1 border border-gray-200 hover:border-transparent active:scale-90 hover:shadow-lg"
              title="삭제하기"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}