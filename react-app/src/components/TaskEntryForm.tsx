import { useState } from "react";
import { FolderOpen } from "lucide-react";
import type { Task, TaskType } from "../types";
import { secondsToDisplay, displayToSeconds, type DelayUnit } from "../utils";

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
  // delay는 항상 초 단위로 저장한다 — 분 단위는 입력 편의를 위한 표시 방식일 뿐,
  // 기존에 저장된 설정 및 main.js의 누적 딜레이 계산과 호환되도록 유지한다.
  const [delayUnit, setDelayUnit] = useState<DelayUnit>(
    task.delay > 0 && task.delay % 60 === 0 ? "min" : "sec"
  );

  const delayDisplayValue = secondsToDisplay(task.delay, delayUnit);

  const handleDelayChange = (raw: string) => {
    const num = Number(raw);
    if (Number.isNaN(num)) return;
    setTask((prev) => ({
      ...prev,
      delay: displayToSeconds(num, delayUnit),
    }));
  };

  const toggleDelayUnit = () => {
    setDelayUnit((prev) => (prev === "sec" ? "min" : "sec"));
  };


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
        <div className="flex flex-wrap items-center gap-4" style={{ borderBottom: "1.5px dashed #D8CBAE", paddingBottom: 16 }}>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setTask((prev) => ({ ...prev, type: "browser" }))}
              className={`mn-type-tab ${task.type === "browser" ? "active" : ""}`}
            >
              🌐 웹
            </button>
            <button
              type="button"
              onClick={() => setTask((prev) => ({ ...prev, type: "program" }))}
              className={`mn-type-tab ${task.type === "program" ? "active" : ""}`}
            >
              💻 앱
            </button>
          </div>
          <div className="flex-1 min-w-[200px]">
            <input
              value={task.title}
              onChange={(e) => setTask((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="이름 (ex: GitLab)"
              className="mn-underline-input"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
          <div className="flex-1 w-full relative">
            <input
              value={task.value}
              onChange={(e) => setTask((prev) => ({ ...prev, value: e.target.value }))}
              placeholder={task.type === "browser" ? "URL 입력" : "경로 입력"}
              className="mn-underline-input"
              style={{ paddingRight: task.type === "program" ? 28 : undefined }}
            />
            {task.type === "program" && (
              <button
                type="button"
                onClick={selectFile}
                className="mn-icon-btn absolute right-0 top-1/2 -translate-y-1/2 p-1"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="number"
                min="0"
                step={delayUnit === "min" ? 0.5 : 1}
                value={delayDisplayValue}
                onChange={(e) => handleDelayChange(e.target.value)}
                className="mn-underline-input text-center"
                style={{ width: 64, paddingRight: 24 }}
              />
              <button
                type="button"
                onClick={toggleDelayUnit}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-bold underline"
                style={{ color: "#A79C7F" }}
                title="단위 전환 (초/분)"
              >
                {delayUnit === "min" ? "분" : "초"}
              </button>
            </div>
            <div className="flex gap-2 ml-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!task.value.trim()}
                className="mn-stamp-primary px-4 py-2"
                title="저장"
              >
                {submitLabel}
              </button>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="mn-stamp-secondary px-4 py-2"
                  title="취소"
                >
                  <span className="w-4 h-4 flex items-center justify-center font-bold">×</span>
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={() => setTask((prev) => ({ ...prev, type: "browser" }))}
          className={`mn-type-tab ${task.type === "browser" ? "active" : ""}`}
        >
          🌐 웹 사이트
        </button>
        <button
          type="button"
          onClick={() => setTask((prev) => ({ ...prev, type: "program" }))}
          className={`mn-type-tab ${task.type === "program" ? "active" : ""}`}
        >
          💻 프로그램
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <div className="md:col-span-3">
          <input
            value={task.title}
            onChange={(e) => setTask((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="이름 (ex: GitLab)"
            className="mn-underline-input"
          />
        </div>

        <div className="md:col-span-5 relative">
          <input
            value={task.value}
            onChange={(e) => setTask((prev) => ({ ...prev, value: e.target.value }))}
            placeholder={task.type === "browser" ? "주소 입력 (ex: https://naver.com)" : "프로그램(.exe) 경로"}
            className="mn-underline-input"
            style={{ paddingRight: task.type === "program" ? 32 : undefined }}
          />
          {task.type === "program" && (
            <button
              type="button"
              onClick={selectFile}
              className="mn-icon-btn absolute right-0 top-1/2 -translate-y-1/2 p-1"
            >
              <FolderOpen className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="md:col-span-2 relative">
          <input
            type="number"
            min="0"
            step={delayUnit === "min" ? 0.5 : 1}
            value={delayDisplayValue}
            onChange={(e) => handleDelayChange(e.target.value)}
            className="mn-underline-input text-center"
            style={{ paddingRight: 28 }}
          />
          <button
            type="button"
            onClick={toggleDelayUnit}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-bold underline"
            style={{ color: "#A79C7F" }}
            title="단위 전환 (초/분)"
          >
            {delayUnit === "min" ? "분" : "초"}
          </button>
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={!task.value.trim()}
            className="mn-stamp-primary w-full py-2.5"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
