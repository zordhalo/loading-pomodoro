// Integration resolved: real hooks replace mock state

import { Header } from './components/Header';
import { TimerCard } from './components/TimerCard';
import { TaskPanel } from './components/TaskPanel';
import { SessionLog } from './components/SessionLog';
import { CommandLog } from './components/CommandLog';
import { useWebSocket } from './hooks/useWebSocket';
import { useBootstrap } from './hooks/useBootstrap';
import { usePomodoro } from './hooks/usePomodoro';

export default function App() {
  const { connected } = useWebSocket();
  useBootstrap();

  const {
    timer,
    tasks,
    selectedTaskId,
    sessions,
    todayStats,
    commands,
    actions,
  } = usePomodoro();

  // ── Render ────────────────────────────────────────────────────────────────────

  const panelClass =
    'bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4';

  return (
    <div className="flex flex-col h-full">
      <Header todayStats={todayStats} connected={connected} />

      {/* Main content */}
      <div className="flex-1 overflow-auto p-4">
        {/*
          Responsive grid:
          - Mobile:  single column
          - Tablet (md): [tasks | timer+logs]
          - Desktop (lg): [tasks | timer | session+command]
        */}
        <div className="max-w-[1400px] mx-auto">
          {/* Desktop 3-col layout */}
          <div className="hidden lg:grid lg:grid-cols-[280px_1fr_280px] gap-4 h-[calc(100vh-4rem-2rem)]">
            {/* Left: Tasks */}
            <div className={`${panelClass} overflow-hidden flex flex-col`}>
              <TaskPanel
                tasks={tasks}
                selectedTaskId={selectedTaskId}
                onAdd={actions.addTask}
                onUpdate={actions.updateTask}
                onDelete={actions.deleteTask}
                onSelect={(id) => void actions.selectTask(id)}
              />
            </div>

            {/* Center: Timer */}
            <div className={`${panelClass} flex items-center justify-center`}>
              <TimerCard
                state={timer}
                onStart={() => void actions.start()}
                onPause={() => void actions.pause()}
                onResume={() => void actions.resume()}
                onReset={() => void actions.reset()}
                onSkip={() => void actions.skip()}
              />
            </div>

            {/* Right: Sessions + Commands stacked */}
            <div className="flex flex-col gap-4 h-full overflow-hidden">
              <div className={`${panelClass} flex-1 overflow-hidden flex flex-col min-h-0`}>
                <SessionLog sessions={sessions} />
              </div>
              <div className={`${panelClass} flex-1 overflow-hidden flex flex-col min-h-0`}>
                <CommandLog entries={commands} />
              </div>
            </div>
          </div>

          {/* Tablet 2-col layout */}
          <div className="hidden md:grid lg:hidden md:grid-cols-[280px_1fr] gap-4">
            {/* Left: Tasks */}
            <div className={`${panelClass}`} style={{ minHeight: 400 }}>
              <TaskPanel
                tasks={tasks}
                selectedTaskId={selectedTaskId}
                onAdd={actions.addTask}
                onUpdate={actions.updateTask}
                onDelete={actions.deleteTask}
                onSelect={(id) => void actions.selectTask(id)}
              />
            </div>

            {/* Right: Timer + logs stacked */}
            <div className="flex flex-col gap-4">
              <div className={`${panelClass} flex items-center justify-center`}>
                <TimerCard
                  state={timer}
                  onStart={() => void actions.start()}
                  onPause={() => void actions.pause()}
                  onResume={() => void actions.resume()}
                  onReset={() => void actions.reset()}
                  onSkip={() => void actions.skip()}
                />
              </div>
              <div className={panelClass} style={{ minHeight: 200 }}>
                <SessionLog sessions={sessions} />
              </div>
              <div className={panelClass} style={{ minHeight: 200 }}>
                <CommandLog entries={commands} />
              </div>
            </div>
          </div>

          {/* Mobile single-column layout */}
          <div className="flex md:hidden flex-col gap-4">
            <div className={`${panelClass} flex items-center justify-center`}>
              <TimerCard
                state={timer}
                onStart={() => void actions.start()}
                onPause={() => void actions.pause()}
                onResume={() => void actions.resume()}
                onReset={() => void actions.reset()}
                onSkip={() => void actions.skip()}
              />
            </div>
            <div className={panelClass}>
              <TaskPanel
                tasks={tasks}
                selectedTaskId={selectedTaskId}
                onAdd={actions.addTask}
                onUpdate={actions.updateTask}
                onDelete={actions.deleteTask}
                onSelect={(id) => void actions.selectTask(id)}
              />
            </div>
            <div className={panelClass}>
              <SessionLog sessions={sessions} />
            </div>
            <div className={panelClass}>
              <CommandLog entries={commands} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
