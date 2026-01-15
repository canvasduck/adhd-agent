'use client';

import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Project, Task } from '@/types';

interface ProjectWithTasks extends Project {
  tasks: Task[];
}

interface ProjectListProps {
  projects: ProjectWithTasks[];
  onTaskComplete: (taskId: string) => void;
  onAddTask: (projectId: string, title: string) => void;
  onAddProject: () => void;
  onDeleteProject: (projectId: string) => void;
}

export function ProjectList({
  projects,
  onTaskComplete,
  onAddTask,
  onAddProject,
  onDeleteProject,
}: ProjectListProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(projects.map((p) => p.id))
  );
  const [addingTaskToProject, setAddingTaskToProject] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const prevProjectIds = useRef<Set<string>>(new Set(projects.map((p) => p.id)));

  // Auto-expand newly added projects and focus task input
  useEffect(() => {
    const currentIds = new Set(projects.map((p) => p.id));
    const newIds = projects
      .filter((p) => !prevProjectIds.current.has(p.id))
      .map((p) => p.id);

    if (newIds.length > 0) {
      setExpandedProjects((prev) => {
        const next = new Set(prev);
        newIds.forEach((id) => next.add(id));
        return next;
      });
      // Focus task input on the first new project
      setAddingTaskToProject(newIds[0]);
    }

    prevProjectIds.current = currentIds;
  }, [projects]);

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const handleAddTask = (projectId: string) => {
    if (!newTaskTitle.trim()) return;
    onAddTask(projectId, newTaskTitle.trim());
    setNewTaskTitle('');
    setAddingTaskToProject(null);
  };

  return (
    <div className="space-y-3">
      {projects.map((project) => {
        const isExpanded = expandedProjects.has(project.id);
        const completedCount = project.tasks.filter((t) => t.status === 'completed').length;
        const totalCount = project.tasks.length;
        const isAddingTask = addingTaskToProject === project.id;

        // Sort tasks: incomplete first, then completed
        const sortedTasks = [...project.tasks].sort((a, b) => {
          if (a.status === 'completed' && b.status !== 'completed') return 1;
          if (a.status !== 'completed' && b.status === 'completed') return -1;
          return 0;
        });

        return (
          <div key={project.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Project Header */}
            <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <button
                onClick={() => toggleProject(project.id)}
                className="flex items-center gap-3 flex-1"
              >
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
                <span className="font-medium text-gray-900">{project.name}</span>
              </button>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  {completedCount}/{totalCount}
                </span>
                <button
                  onClick={() => onDeleteProject(project.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete project"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Tasks */}
            {isExpanded && (
              <div className="border-t border-gray-100">
                {sortedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-b-0"
                  >
                    <Checkbox
                      checked={task.status === 'completed'}
                      onChange={() => onTaskComplete(task.id)}
                    />
                    <span
                      className={cn(
                        'flex-1 text-sm',
                        task.status === 'completed'
                          ? 'line-through text-gray-400'
                          : 'text-gray-700'
                      )}
                    >
                      {task.title}
                    </span>
                  </div>
                ))}

                {/* Add Task Input */}
                {isAddingTask ? (
                  <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100">
                    <Input
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Task title"
                      autoFocus
                      className="flex-1 h-8 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddTask(project.id);
                        if (e.key === 'Escape') {
                          setAddingTaskToProject(null);
                          setNewTaskTitle('');
                        }
                      }}
                    />
                    <Button size="sm" onClick={() => handleAddTask(project.id)}>
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setAddingTaskToProject(null);
                        setNewTaskTitle('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingTaskToProject(project.id)}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-500 hover:text-indigo-600 hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add task</span>
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add Project Button */}
      <button
        onClick={onAddProject}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
      >
        <Plus className="h-5 w-5" />
        <span className="font-medium">Add project</span>
      </button>
    </div>
  );
}
