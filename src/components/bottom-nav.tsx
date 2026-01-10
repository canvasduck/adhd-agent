'use client';

import { cn } from '@/lib/utils';
import { ListTodo, MessageCircle, Camera } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BottomNavProps {
  onCoachClick: () => void;
  onCameraClick: () => void;
}

export function BottomNav({ onCoachClick, onCameraClick }: BottomNavProps) {
  const pathname = usePathname();
  const isTodosActive = pathname === '/todos';
  const isHomeActive = pathname === '/';

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 pb-safe">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Todos */}
        <Link
          href="/todos"
          className={cn(
            'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[64px]',
            isTodosActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <ListTodo className="h-6 w-6" />
          <span className="text-xs font-medium">Todos</span>
        </Link>

        {/* Coach - Center button, elevated */}
        <button
          onClick={onCoachClick}
          className={cn(
            'flex flex-col items-center gap-1 p-3 rounded-full transition-all',
            'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 active:scale-95',
            '-mt-4'
          )}
        >
          <MessageCircle className="h-7 w-7" />
        </button>

        {/* Camera */}
        <button
          onClick={onCameraClick}
          className={cn(
            'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[64px]',
            'text-gray-500 hover:text-gray-700'
          )}
        >
          <Camera className="h-6 w-6" />
          <span className="text-xs font-medium">Capture</span>
        </button>
      </div>
    </nav>
  );
}
