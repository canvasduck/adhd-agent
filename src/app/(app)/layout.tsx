'use client';

import { useState } from 'react';
import { BottomNav } from '@/components/bottom-nav';
import { CoachPanel } from '@/components/coach-panel';
import { CameraPanel } from '@/components/camera-panel';
import type { ExtractedTask } from '@/types';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleTasksCreated = async (projectName: string, tasks: ExtractedTask[]) => {
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName, tasks }),
      });

      if (!response.ok) throw new Error('Failed to create tasks');

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
