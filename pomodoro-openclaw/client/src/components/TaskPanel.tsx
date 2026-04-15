import { useState } from 'react';
import { Pencil, Trash2, Check, X, Plus } from 'lucide-react';
import { Task } from '../lib/types';
import { Button } from './ui/Button';
import { cn } from '../lib/cn';

interface TaskPanelProps {
  tasks: Task[];
  selectedTaskId: string | null;
  onAdd: (name: string, estimate: number) => void;
  onUpdate: (id: string, patch: Partial<Pick<Task, 'name' | 'estimate'>>) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}

const ESTIMATE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

function EstimateSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {ESTIMATE_OPTIONS.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={cn(
            'w-6 h-6 rounded text-xs font-medium transition-colors',
            value === n
              ? 'bg-[var(--primary)] text-white'
              : 'bg-[var(--surface-3)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]',
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function AddTaskForm({ onSave, onCancel }: { onSave: (name: string, estimate: number) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [estimate, setEstimate] = useState(1);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed, estimate);
  };

  return (
    <div
      className="flex flex-col gap-2 p-3 rounded-lg"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
    >
      <input
        type="text"
        autoFocus
        placeholder="Task name…"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') onCancel();
        }}
        className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-faint)]"
        style={{ color: 'var(--text)' }}
      />
      <div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Estimate (pomodoros)</p>
        <EstimateSelector value={estimate} onChange={setEstimate} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={!name.trim()}>
          Save
        </Button>
      </div>
    </div>
  );
}

interface TaskRowProps {
  task: Task;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<Pick<Task, 'name' | 'estimate'>>) => void;
  onDelete: () => void;
}

function TaskRow({ task, isSelected, onSelect, onUpdate, onDelete }: TaskRowProps) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(task.name);
  const [editEstimate, setEditEstimate] = useState(task.estimate);

  const saveEdit = () => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    onUpdate({ name: trimmed, estimate: editEstimate });
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditName(task.name);
    setEditEstimate(task.estimate);
    setEditing(false);
  };

  if (editing) {
    return (
      <div
        className="flex flex-col gap-2 p-3 rounded-lg"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
      >
        <input
          type="text"
          autoFocus
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveEdit();
            if (e.key === 'Escape') cancelEdit();
          }}
          className="w-full bg-transparent text-sm outline-none"
          style={{ color: 'var(--text)' }}
        />
        <EstimateSelector value={editEstimate} onChange={setEditEstimate} />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={cancelEdit}>
            <X size={12} /> Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={saveEdit} disabled={!editName.trim()}>
            <Check size={12} /> Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors cursor-pointer',
        isSelected
          ? 'border-l-2 pl-[10px]'
          : 'border-l-2 border-transparent pl-[10px]',
      )}
      style={
        isSelected
          ? {
              background: 'var(--surface-2)',
              borderLeftColor: 'var(--primary)',
            }
          : {
              background: 'transparent',
            }
      }
      onClick={onSelect}
    >
      {/* Task name */}
      <span className="flex-1 text-sm truncate" style={{ color: 'var(--text)' }}>
        {task.name}
      </span>

      {/* Progress */}
      <span
        className="shrink-0 text-xs tabular-nums"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
      >
        {task.completed}/{task.estimate} 🍅
      </span>

      {/* Actions — visible on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          aria-label="Edit task"
          onClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          className="p-1 rounded hover:bg-[var(--surface-3)] transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <Pencil size={12} />
        </button>
        <button
          type="button"
          aria-label="Delete task"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded hover:bg-[var(--error)]/10 transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

export function TaskPanel({ tasks, selectedTaskId, onAdd, onUpdate, onDelete, onSelect }: TaskPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAdd = (name: string, estimate: number) => {
    onAdd(name, estimate);
    setShowAddForm(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          Tasks
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAddForm((v) => !v)}
          aria-label="Add task"
        >
          <Plus size={13} />
          Add
        </Button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="mb-3">
          <AddTaskForm
            onSave={handleAdd}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Task list */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1 min-h-0">
        {tasks.length === 0 ? (
          <p className="text-center py-8" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            No tasks yet — add your first one ↑
          </p>
        ) : (
          tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              isSelected={task.id === selectedTaskId}
              onSelect={() => onSelect(task.id)}
              onUpdate={(patch) => onUpdate(task.id, patch)}
              onDelete={() => onDelete(task.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
