'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function AuthErrorPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900">
          Authentication Error
        </h1>
        <p className="text-gray-600 mt-2">
          Something went wrong during sign in. Please try again.
        </p>
        <Button
          onClick={() => router.push('/')}
          className="mt-6"
        >
          Go home
        </Button>
      </div>
    </div>
  );
}
