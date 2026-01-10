'use client';

import { useState, useEffect } from 'react';
import { TaskCard } from '@/components/task-card';
import { getTimeBasedGreeting } from '@/lib/utils';
import { Camera, MessageCircle, Sparkles } from 'lucide-react';
import type { Task, Project } from '@/types';

interface ProjectWithTasks extends Project {
  tasks: Task[];
}

export default function HomePage() {
  const [projects, setProjects] = useState<ProjectWithTasks[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const greeting = getTimeBasedGreeting();

  const fetchTodos = async () => {
    try {
      const response = await fetch('/api/todos');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();

    // Listen for todos updates
    const handleUpdate = () => fetchTodos();
    window.addEventListener('todos-updated', handleUpdate);
    return () => window.removeEventListener('todos-updated', handleUpdate);
  }, []);

  const handleTaskComplete = async (taskId: string) => {
    try {
      await fetch('/api/todos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          updates: { status: 'completed' },
        }),
      });
      fetchTodos();
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  // Get up to 3 incomplete tasks across all projects
  const incompleteTasks = projects
    .flatMap((project) =>
      project.tasks
        .filter((task) => task.status !== 'completed')
        .map((task) => ({ task, project }))
    )
    .slice(0, 3);

  const allTasksComplete = incompleteTasks.length === 0 && projects.length > 0;

  return (
    <div className="px-4 pt-safe">
      {/* Header */}
      <div className="py-6">
        <h1 className="text-2xl font-bold text-gray-900">{greeting}!</h1>
        <p className="text-gray-600 mt-1">
          {incompleteTasks.length > 0
            ? "Here's what you can knock out:"
            : "Ready to tackle something?"}
        </p>
      </div>

      {/* Tasks */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-white rounded-xl border border-gray-200 animate-pulse"
              />
            ))}
          </div>
        ) : incompleteTasks.length > 0 ? (
          incompleteTasks.map(({ task, project }) => (
            <TaskCard
              key={task.id}
              task={task}
              project={project}
              onComplete={handleTaskComplete}
              showProject={true}
            />
          ))
        ) : allTasksComplete ? (
          // All tasks complete - celebration!
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              You&apos;re all caught up!
            </h2>
            <p className="text-gray-600 mt-2 max-w-xs mx-auto">
              Nothing on your plate. Enjoy the moment, or take on something new.
            </p>
            <div className="flex flex-col gap-3 mt-6 max-w-xs mx-auto">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-camera'))}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
              >
                <Camera className="h-5 w-5" />
                Take a photo of a space
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-coach'))}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                Chat with your coach
              </button>
            </div>
          </div>
        ) : (
          // No projects at all - empty state
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="h-10 w-10 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Nothing here yet!
            </h2>
            <p className="text-gray-600 mt-2 max-w-xs mx-auto">
              Take a photo of a messy spot and I&apos;ll help you break it down into tiny
              steps.
            </p>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-camera'))}
              className="mt-6 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors mx-auto"
            >
              <Camera className="h-5 w-5" />
              Open camera
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
