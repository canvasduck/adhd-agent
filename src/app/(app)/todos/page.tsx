'use client';

import { useState, useEffect } from 'react';
import { ProjectList } from '@/components/project-list';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Project, Task } from '@/types';

interface ProjectWithTasks extends Project {
  tasks: Task[];
}

export default function TodosPage() {
  const [projects, setProjects] = useState<ProjectWithTasks[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [addingTaskToProject, setAddingTaskToProject] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

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

    const handleUpdate = () => fetchTodos();
    window.addEventListener('todos-updated', handleUpdate);
    return () => window.removeEventListener('todos-updated', handleUpdate);
  }, []);

  const handleTaskComplete = async (taskId: string) => {
    // Optimistically update UI
    setProjects((prev) =>
      prev.map((project) => ({
        ...project,
        tasks: project.tasks.map((task) =>
          task.id === taskId ? { ...task, status: 'completed' as const } : task
        ),
      }))
    );

    try {
      await fetch('/api/todos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          updates: { status: 'completed' },
        }),
      });
    } catch (error) {
      console.error('Failed to complete task:', error);
      fetchTodos(); // Revert on error
    }
  };

  const handleAddProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: newProjectName.trim(),
          tasks: [{ title: 'First task' }],
        }),
      });

      if (response.ok) {
        setNewProjectName('');
        setIsAddingProject(false);
        fetchTodos();
      }
    } catch (error) {
      console.error('Failed to add project:', error);
    }
  };

  const handleAddTask = async (projectId: string) => {
    if (!newTaskTitle.trim()) return;

    // For now, we'll need to add a task-specific endpoint
    // This is a placeholder that shows the UI works
    setAddingTaskToProject(null);
    setNewTaskTitle('');
    // TODO: Implement task creation endpoint
  };

  if (isLoading) {
    return (
      <div className="px-4 pt-safe">
        <div className="py-6">
          <h1 className="text-2xl font-bold text-gray-900">Todos</h1>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 bg-white rounded-xl border border-gray-200 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-safe">
      {/* Header */}
      <div className="flex items-center justify-between py-6">
        <h1 className="text-2xl font-bold text-gray-900">Todos</h1>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsAddingProject(true)}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Add Project Modal */}
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

      {/* Projects */}
      {projects.length > 0 ? (
        <ProjectList
          projects={projects}
          onTaskComplete={handleTaskComplete}
          onAddTask={(projectId) => setAddingTaskToProject(projectId)}
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
  );
}
