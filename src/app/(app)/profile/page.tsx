'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut, User, Mail } from 'lucide-react';

export default function ProfilePage() {
  const { user, signOut, authEnabled } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  // If auth is disabled, show a simple message
  if (!authEnabled) {
    return (
      <div className="px-4 pt-safe">
        <div className="py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>
        </div>

        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-10 w-10 text-gray-400" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Guest Mode</h1>
          <p className="text-gray-600 mt-2">
            Authentication is currently disabled.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-safe">
      {/* Header */}
      <div className="py-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>
      </div>

      {/* Profile info */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          {user?.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <User className="h-10 w-10 text-indigo-600" />
          )}
        </div>
        <h1 className="text-xl font-semibold text-gray-900">
          {user?.user_metadata?.full_name || 'Your Profile'}
        </h1>
        {user?.email && (
          <div className="flex items-center justify-center gap-2 text-gray-600 mt-1">
            <Mail className="h-4 w-4" />
            {user.email}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3 max-w-sm mx-auto">
        <Button
          variant="outline"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
