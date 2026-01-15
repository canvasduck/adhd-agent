'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/auth-modal';
import { X, Lock } from 'lucide-react';
import { UNAUTH_LIMITS } from '@/lib/limits';

interface LimitModalProps {
  open: boolean;
  onClose: () => void;
  limitType: 'project' | 'task';
}

export function LimitModal({ open, onClose, limitType }: LimitModalProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (!open) return null;

  const limitInfo = {
    project: {
      title: 'Project limit reached',
      description: `You've reached the limit of ${UNAUTH_LIMITS.maxProjects} projects for guest users.`,
    },
    task: {
      title: 'Task limit reached',
      description: `You've reached the limit of ${UNAUTH_LIMITS.maxTasks} tasks for guest users.`,
    },
  };

  const { title, description } = limitInfo[limitType];

  const handleSignIn = () => {
    setShowAuthModal(true);
  };

  const handleAuthClose = () => {
    setShowAuthModal(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8 text-amber-600" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <p className="text-gray-600 mt-2">{description}</p>
            <p className="text-gray-600 mt-4">
              Sign in to unlock unlimited projects and tasks, plus sync across devices.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button className="w-full" onClick={handleSignIn}>
              Sign in to continue
            </Button>
            <Button variant="ghost" className="w-full" onClick={onClose}>
              Maybe later
            </Button>
          </div>
        </div>
      </div>

      <AuthModal open={showAuthModal} onClose={handleAuthClose} />
    </>
  );
}
