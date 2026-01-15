'use client';

import { useState, useEffect } from 'react';
import { BottomNav } from '@/components/bottom-nav';
import { CoachPanel } from '@/components/coach-panel';
import { CameraPanel } from '@/components/camera-panel';
import { useAuth } from '@/lib/auth/context';
import { createProject } from '@/lib/data';
import type { ExtractedTask } from '@/types';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Listen for custom events to open camera/coach
  useEffect(() => {
    const handleOpenCamera = () => setIsCameraOpen(true);
    const handleOpenCoach = () => setIsCoachOpen(true);

    window.addEventListener('open-camera', handleOpenCamera);
    window.addEventListener('open-coach', handleOpenCoach);

    return () => {
      window.removeEventListener('open-camera', handleOpenCamera);
      window.removeEventListener('open-coach', handleOpenCoach);
    };
  }, []);

  const handleTasksCreated = async (projectName: string, tasks: ExtractedTask[]) => {
    try {
      await createProject(isAuthenticated, projectName, tasks, 'image');

      // Trigger a refresh of the todos list
      window.dispatchEvent(new CustomEvent('todos-updated'));
    } catch (error) {
      console.error('Failed to create tasks:', error);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {children}

      <BottomNav
        onCoachClick={() => setIsCoachOpen(true)}
        onCameraClick={() => setIsCameraOpen(true)}
      />

      <CoachPanel open={isCoachOpen} onClose={() => setIsCoachOpen(false)} />

      <CameraPanel
        open={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onTasksCreated={handleTasksCreated}
      />
    </div>
  );
}
