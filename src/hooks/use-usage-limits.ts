'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/context';
import { getLocalProjects, getLocalTasks } from '@/lib/data/local-storage';
import { UNAUTH_LIMITS } from '@/lib/limits';

export interface UsageLimits {
  projectCount: number;
  taskCount: number;
  maxProjects: number;
  maxTasks: number;
  isAtProjectLimit: boolean;
  isAtTaskLimit: boolean;
  isAtAnyLimit: boolean;
  refresh: () => void;
}

export function useUsageLimits(): UsageLimits {
  const { isAuthenticated } = useAuth();
  const [projectCount, setProjectCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);

  const refresh = useCallback(() => {
    if (isAuthenticated) {
      // Authenticated users have no limits
      setProjectCount(0);
      setTaskCount(0);
      return;
    }

    const projects = getLocalProjects();
    const tasks = getLocalTasks();
    setProjectCount(projects.length);
    setTaskCount(tasks.length);
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();

    // Listen for updates to refresh counts
    const handleUpdate = () => refresh();
    window.addEventListener('todos-updated', handleUpdate);
    return () => window.removeEventListener('todos-updated', handleUpdate);
  }, [refresh]);

  // Authenticated users have no limits
  if (isAuthenticated) {
    return {
      projectCount: 0,
      taskCount: 0,
      maxProjects: Infinity,
      maxTasks: Infinity,
      isAtProjectLimit: false,
      isAtTaskLimit: false,
      isAtAnyLimit: false,
      refresh,
    };
  }

  const isAtProjectLimit = projectCount >= UNAUTH_LIMITS.maxProjects;
  const isAtTaskLimit = taskCount >= UNAUTH_LIMITS.maxTasks;

  return {
    projectCount,
    taskCount,
    maxProjects: UNAUTH_LIMITS.maxProjects,
    maxTasks: UNAUTH_LIMITS.maxTasks,
    isAtProjectLimit,
    isAtTaskLimit,
    isAtAnyLimit: isAtProjectLimit || isAtTaskLimit,
    refresh,
  };
}
