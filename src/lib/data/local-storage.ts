'use client';

import type { Project, Task } from '@/types';

const STORAGE_KEYS = {
  PROJECTS: 'adhd-app-projects',
  TASKS: 'adhd-app-tasks',
} as const;

export interface ProjectWithTasks extends Project {
  tasks: Task[];
}

function generateId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getFromStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setToStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

// Projects
export function getLocalProjects(): Project[] {
  return getFromStorage<Project>(STORAGE_KEYS.PROJECTS);
}

export function getLocalTasks(): Task[] {
  return getFromStorage<Task>(STORAGE_KEYS.TASKS);
}

export function getLocalProjectsWithTasks(): ProjectWithTasks[] {
  const projects = getLocalProjects();
  const tasks = getLocalTasks();

  return projects.map((project) => ({
    ...project,
    tasks: tasks
      .filter((task) => task.project_id === project.id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
  }));
}

export function createLocalProject(name: string): Project {
  const now = new Date().toISOString();
  const project: Project = {
    id: generateId(),
    user_id: null,
    name,
    created_at: now,
    updated_at: now,
  };

  const projects = getLocalProjects();
  setToStorage(STORAGE_KEYS.PROJECTS, [project, ...projects]);
  return project;
}

export function createLocalTask(
  projectId: string,
  title: string,
  source: 'manual' | 'image' | 'coach' = 'manual'
): Task {
  const now = new Date().toISOString();
  const task: Task = {
    id: generateId(),
    user_id: null,
    project_id: projectId,
    title,
    status: 'pending',
    source,
    created_at: now,
    updated_at: now,
  };

  const tasks = getLocalTasks();
  setToStorage(STORAGE_KEYS.TASKS, [...tasks, task]);
  return task;
}

export function createLocalProjectWithTasks(
  projectName: string,
  taskTitles: { title: string }[],
  source: 'manual' | 'image' | 'coach' = 'image'
): ProjectWithTasks {
  const project = createLocalProject(projectName);
  const tasks = taskTitles.map((t) => createLocalTask(project.id, t.title, source));
  return { ...project, tasks };
}

export function updateLocalTask(
  taskId: string,
  updates: { status?: Task['status']; title?: string }
): Task | null {
  const tasks = getLocalTasks();
  const taskIndex = tasks.findIndex((t) => t.id === taskId);

  if (taskIndex === -1) return null;

  const updatedTask: Task = {
    ...tasks[taskIndex],
    ...updates,
    updated_at: new Date().toISOString(),
  };

  tasks[taskIndex] = updatedTask;
  setToStorage(STORAGE_KEYS.TASKS, tasks);
  return updatedTask;
}

export function deleteLocalProject(projectId: string): void {
  const projects = getLocalProjects().filter((p) => p.id !== projectId);
  const tasks = getLocalTasks().filter((t) => t.project_id !== projectId);
  setToStorage(STORAGE_KEYS.PROJECTS, projects);
  setToStorage(STORAGE_KEYS.TASKS, tasks);
}

export function deleteLocalTask(taskId: string): void {
  const tasks = getLocalTasks().filter((t) => t.id !== taskId);
  setToStorage(STORAGE_KEYS.TASKS, tasks);
}

// Migration helpers
export function getLocalDataForMigration(): { projects: Project[]; tasks: Task[] } {
  return {
    projects: getLocalProjects(),
    tasks: getLocalTasks(),
  };
}

export function clearLocalData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.PROJECTS);
  localStorage.removeItem(STORAGE_KEYS.TASKS);
}

export function hasLocalData(): boolean {
  const projects = getLocalProjects();
  const tasks = getLocalTasks();
  return projects.length > 0 || tasks.length > 0;
}
