'use client';

import { useState, useEffect, useCallback } from 'react';
import { TaskCard } from '@/components/task-card';
import { ProjectList } from '@/components/project-list';
import { ProfileButton } from '@/components/profile-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getTimeBasedGreeting } from '@/lib/utils';
import { Camera, MessageCircle, Sparkles, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/context';
import {
  fetchProjects,
  createProject,
  addTask,
  updateTask,
  type ProjectWithTasks,
} from '@/lib/data';

type ViewMode = 'focus' | 'all';

export default function HomePage() {
  const { isAuthenticated, isLoading: authLoading, isMigrating } = useAuth();
  const [projects, setProjects] = useState<ProjectWithTasks[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('focus');
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const greeting = getTimeBasedGreeting();

  const loadProjects = useCallback(async () => {
    if (authLoading) return;
    try {
      const data = await fetchProjects(isAuthenticated);
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    loadProjects();

    const handleUpdate = () => loadProjects();
    window.addEventListener('todos-updated', handleUpdate);
    return () => window.removeEventListener('todos-updated', handleUpdate);
  }, [loadProjects]);

  const handleTaskToggle = async (taskId: string) => {
    // Find current status
    const task = projects
      .flatMap((p) => p.tasks)
      .find((t) => t.id === taskId);
    const newStatus = task?.status === 'completed' ? 'pending' : 'completed';

    // Optimistic update
    setProjects((prev) =>
      prev.map((project) => ({
        ...project,
        tasks: project.tasks.map((t) =>
          t.id === taskId ? { ...t, status: newStatus as 'pending' | 'completed' } : t
        ),
      }))
    );

    try {
      await updateTask(isAuthenticated, taskId, { status: newStatus });
    } catch (error) {
      console.error('Failed to update task:', error);
      loadProjects(); // Revert on error
    }
  };

  const handleAddProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      await createProject(isAuthenticated, newProjectName.trim(), [{ title: 'First task' }], 'manual');
      setNewProjectName('');
      setIsAddingProject(false);
      loadProjects();
    } catch (error) {
      console.error('Failed to add project:', error);
    }
  };

  const handleAddTask = async (projectId: string, title: string) => {
    try {
      await addTask(isAuthenticated, projectId, title);
      loadProjects();
    } catch (error) {
      console.error('Failed to add task:', error);
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
      <div className="py-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting}!</h1>
          <p className="text-gray-600 mt-1">
            {viewMode === 'focus'
              ? incompleteTasks.length > 0
                ? "Here's what you can knock out:"
                : 'Ready to tackle something?'
              : 'All your projects'}
          </p>
        </div>
        <ProfileButton />
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('focus')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              viewMode === 'focus'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            Focus
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              viewMode === 'all'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            All
          </button>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsAddingProject(true)}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Add Project Form */}
      {isAddingProject && (
        <div className="mb-4 p-4 bg-white rounded-xl border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">New Project</h3>
          <div className="flex gap-2">
            <Input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAddProject()}
            />
            <Button onClick={handleAddProject}>Add</Button>
            <Button variant="ghost" onClick={() => setIsAddingProject(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading || authLoading || isMigrating ? (
        <div className="space-y-3">
          {isMigrating && (
            <div className="text-center py-4 text-gray-600">
              <p className="text-sm">Syncing your data...</p>
            </div>
          )}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-white rounded-xl border border-gray-200 animate-pulse"
            />
          ))}
        </div>
      ) : viewMode === 'focus' ? (
        /* Focus View - Top 3 Tasks */
        <div className="space-y-3">
          {incompleteTasks.length > 0 ? (
            incompleteTasks.map(({ task, project }) => (
              <TaskCard
                key={task.id}
                task={task}
                project={project}
                onComplete={handleTaskToggle}
                showProject={true}
              />
            ))
          ) : allTasksComplete ? (
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
      ) : (
        /* All View - Full Project List */
        <div>
          {projects.length > 0 ? (
            <ProjectList
              projects={projects}
              onTaskComplete={handleTaskToggle}
              onAddTask={handleAddTask}
              onAddProject={() => setIsAddingProject(true)}
            />
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <h2 className="text-lg font-medium text-gray-900">No projects yet</h2>
              <p className="text-gray-600 mt-1">
                Take a photo of a space or add a project manually.
              </p>
              <Button
                onClick={() => setIsAddingProject(true)}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add project
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
