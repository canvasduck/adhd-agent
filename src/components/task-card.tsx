'use client';

import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { getRandomCompletionMessage } from '@/lib/utils';
import { useState } from 'react';
import type { Task, Project } from '@/types';

interface TaskCardProps {
  task: Task;
  project?: Project;
  onComplete: (taskId: string) => void;
  onClick?: () => void;
  showProject?: boolean;
  compact?: boolean;
}

export function TaskCard({
  task,
  project,
  onComplete,
  onClick,
  showProject = true,
  compact = false,
}: TaskCardProps) {
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const isCompleted = task.status === 'completed';

  const handleComplete = () => {
    if (isCompleted || isCompleting) return;

    setIsCompleting(true);
    setCompletionMessage(getRandomCompletionMessage());

    // Play sound (if available and enabled)
    try {
      const audio = new Audio('/sounds/complete.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore if sound fails
    } catch {}

    // Delay the actual completion to show animation
    setTimeout(() => {
      onComplete(task.id);
    }, 500);
  };

  return (
    <div
      className={cn(
        'relative bg-white rounded-xl border border-gray-200 transition-all duration-300',
        isCompleting && 'scale-95 opacity-50',
        !compact && 'p-4',
        compact && 'p-3'
      )}
    >
      {/* Completion message overlay */}
      {completionMessage && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-50 rounded-xl animate-pulse">
          <span className="text-green-600 font-semibold text-lg">{completionMessage}</span>
        </div>
      )}

      <div className={cn('flex items-start gap-3', completionMessage && 'invisible')}>
        <Checkbox
          checked={isCompleted}
          onChange={handleComplete}
          disabled={isCompleting}
        />

        <div
          className={cn('flex-1 min-w-0', onClick && 'cursor-pointer')}
          onClick={onClick}
        >
          <p
            className={cn(
              'text-gray-900 font-medium',
              isCompleted && 'line-through text-gray-400',
              compact ? 'text-sm' : 'text-base'
            )}
          >
            {task.title}
          </p>
          {showProject && project && (
            <p className="text-xs text-gray-500 mt-0.5">~ {project.name}</p>
          )}
        </div>
      </div>
    </div>
  );
}
