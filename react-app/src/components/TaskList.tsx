import { useState } from "react";
import type { Task } from "../types";
import { ArrowUp, ArrowDown, Trash2, Pencil, Check, Globe, Monitor } from "lucide-react";
import TaskEntryForm from "./TaskEntryForm";

export default function TaskList({
  tasks,
  onRemove,
  onUpdate,
  onMove,
}: {
  tasks: Task[];
  onRemove: (i: number) => void;
  onUpdate: (i: number, task: Task) => void;
  onMove: (from: number, to: number) => void;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const startEditing = (i: number) => {
    setEditingIndex(i);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
  };

  return (
    <div>
      {tasks.map((task, i) => {
        const isEditing = editingIndex === i;

        return (
          <div
            key={i}
            className={isEditing ? "" : "mn-row"}
            style={
              isEditing
                ? {
                    border: "1.5px solid #C9634A",
                    borderRadius: 16,
                    padding: 16,
                    margin: "8px 0",
                    background: "#FFF9EF",
                  }
                : undefined
            }
          >
            {isEditing ? (
              <TaskEntryForm
                initialValues={task}
                onSubmit={(updatedTask) => {
                  onUpdate(i, updatedTask);
                  cancelEditing();
                }}
                onCancel={cancelEditing}
                submitLabel={<Check className="w-4 h-4" />}
                variant="edit"
              />
            ) : (
              /* Normal View Mode */
              <>
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div
                    className="shrink-0 flex items-center justify-center rounded-full"
                    style={{ width: 36, height: 36, background: "rgba(201,99,74,0.1)", color: "#C9634A" }}
                  >
                    {task.type === "browser" ? <Globe className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate" style={{ color: "#1F2A44" }} title={task.value}>
                      {task.title || task.value}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#A79C7F" }}>
                      {task.type === "browser" ? "웹사이트" : "프로그램"} · 대기 {task.delay}초
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:shrink-0 justify-end mt-2 sm:mt-0">
                  <button
                    onClick={() => onMove(i, i - 1)}
                    disabled={i === 0 || editingIndex !== null}
                    className="mn-icon-btn p-2"
                    title="위로 올리기"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onMove(i, i + 1)}
                    disabled={i === tasks.length - 1 || editingIndex !== null}
                    className="mn-icon-btn p-2"
                    title="아래로 내리기"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => startEditing(i)}
                    className="mn-icon-btn p-2"
                    title="수정하기"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onRemove(i)}
                    disabled={editingIndex !== null}
                    className="mn-icon-btn p-2"
                    title="삭제하기"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
