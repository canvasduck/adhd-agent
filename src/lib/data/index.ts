'use client';

import type { Project, Task } from '@/types';
import {
  getLocalProjectsWithTasks,
  createLocalProject,
  createLocalTask,
  createLocalProjectWithTasks,
  updateLocalTask,
  deleteLocalProject,
  getLocalDataForMigration,
  clearLocalData,
  hasLocalData,
  type ProjectWithTasks,
} from './local-storage';

export type { ProjectWithTasks };

// Fetch all projects with tasks
export async function fetchProjects(isAuthenticated: boolean): Promise<ProjectWithTasks[]> {
  if (!isAuthenticated) {
    return getLocalProjectsWithTasks();
  }

  const response = await fetch('/api/todos');
  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }
  return response.json();
}

// Create a new project (optionally with initial tasks)
export async function createProject(
  isAuthenticated: boolean,
  projectName: string,
  tasks: { title: string }[] = [],
  source: 'manual' | 'image' | 'coach' = 'image'
): Promise<ProjectWithTasks> {
  if (!isAuthenticated) {
    if (tasks.length === 0) {
      const project = createLocalProject(projectName);
      return { ...project, tasks: [] };
    }
    return createLocalProjectWithTasks(projectName, tasks, source);
  }

  const response = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName, tasks: tasks.length > 0 ? tasks : undefined }),
  });

  if (!response.ok) {
    throw new Error('Failed to create project');
  }
  return response.json();
}

// Delete a project and all its tasks
export async function deleteProject(
  isAuthenticated: boolean,
  projectId: string
): Promise<void> {
  if (!isAuthenticated) {
    deleteLocalProject(projectId);
    return;
  }

  const response = await fetch('/api/todos', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId }),
  });

  if (!response.ok) {
    throw new Error('Failed to delete project');
  }
}

// Add a task to an existing project
export async function addTask(
  isAuthenticated: boolean,
  projectId: string,
  title: string
): Promise<Task> {
  if (!isAuthenticated) {
    return createLocalTask(projectId, title, 'manual');
  }

  const response = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, title }),
  });

  if (!response.ok) {
    throw new Error('Failed to add task');
  }
  return response.json();
}

// Update a task (e.g., mark complete)
export async function updateTask(
  isAuthenticated: boolean,
  taskId: string,
  updates: { status?: Task['status']; title?: string }
): Promise<Task | null> {
  if (!isAuthenticated) {
    return updateLocalTask(taskId, updates);
  }

  const response = await fetch('/api/todos', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId, updates }),
  });

  if (!response.ok) {
    throw new Error('Failed to update task');
  }
  return response.json();
}

// Migration: Move localStorage data to Supabase
export async function migrateLocalDataToServer(): Promise<{
  success: boolean;
  migratedProjects: number;
  migratedTasks: number;
}> {
  if (!hasLocalData()) {
    return { success: true, migratedProjects: 0, migratedTasks: 0 };
  }

  const { projects, tasks } = getLocalDataForMigration();
  let migratedProjects = 0;
  let migratedTasks = 0;

  try {
    // Create a mapping of old local IDs to new server IDs
    const projectIdMap = new Map<string, string>();

    // Migrate each project with its tasks
    for (const project of projects) {
      const projectTasks = tasks.filter((t) => t.project_id === project.id);

      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: project.name,
          tasks: projectTasks.map((t) => ({ title: t.title })),
        }),
      });

      if (response.ok) {
        const newProject = await response.json();
        projectIdMap.set(project.id, newProject.id);
        migratedProjects++;
        migratedTasks += projectTasks.length;
      }
    }

    // Clear localStorage after successful migration
    clearLocalData();

    return { success: true, migratedProjects, migratedTasks };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, migratedProjects, migratedTasks };
  }
}

// Check if there's local data to migrate
export { hasLocalData, clearLocalData };
