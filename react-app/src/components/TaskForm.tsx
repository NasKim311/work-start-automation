import TaskEntryForm from "./TaskEntryForm";
import type { Task } from "../types";

export default function TaskForm({ onAdd }: { onAdd: (task: Task) => void }) {
  return (
    <TaskEntryForm
      onSubmit={onAdd}
      submitLabel="➕ 담기"
      variant="add"
    />
  );
}