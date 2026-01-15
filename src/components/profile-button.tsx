'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { AuthModal } from '@/components/auth-modal';
import { User } from 'lucide-react';

export function ProfileButton() {
  const { user, isAuthenticated, isLoading, authEnabled } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    if (!authEnabled) {
      // Auth disabled, go to profile page (which shows guest mode)
      router.push('/profile');
      return;
    }

    if (isAuthenticated && user) {
      // User is logged in, go to profile
      router.push('/profile');
    } else {
      // User is not logged in, show auth modal
      setShowAuthModal(true);
    }
  };

  if (isLoading) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors overflow-hidden"
      >
        {user?.user_metadata?.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <User className="h-5 w-5 text-gray-600" />
        )}
      </button>

      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
