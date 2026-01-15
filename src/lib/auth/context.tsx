'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { config } from '@/lib/config';
import { migrateLocalDataToServer, hasLocalData } from '@/lib/data';
import type { User } from '@supabase/supabase-js';

interface MigrationResult {
  success: boolean;
  migratedProjects: number;
  migratedTasks: number;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authEnabled: boolean;
  signOut: () => Promise<void>;
  // Migration
  isMigrating: boolean;
  migrationResult: MigrationResult | null;
  checkAndMigrateData: () => Promise<MigrationResult>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(config.authEnabled);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const hasMigrated = useRef(false);

  const checkAndMigrateData = useCallback(async (): Promise<MigrationResult> => {
    if (hasMigrated.current || !hasLocalData()) {
      return { success: true, migratedProjects: 0, migratedTasks: 0 };
    }

    setIsMigrating(true);
    try {
      const result = await migrateLocalDataToServer();
      setMigrationResult(result);
      hasMigrated.current = true;

      // Dispatch event to refresh todos after migration
      if (result.success && (result.migratedProjects > 0 || result.migratedTasks > 0)) {
        window.dispatchEvent(new CustomEvent('todos-updated'));
      }

      return result;
    } finally {
      setIsMigrating(false);
    }
  }, []);

  useEffect(() => {
    if (!config.authEnabled) {
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsLoading(false);

      // Auto-migrate if user is already authenticated
      if (user && hasLocalData()) {
        checkAndMigrateData();
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);

      // Migrate data when user signs in
      if (event === 'SIGNED_IN' && newUser && hasLocalData()) {
        checkAndMigrateData();
      }
    });

    return () => subscription.unsubscribe();
  }, [checkAndMigrateData]);

  const signOut = async () => {
    if (!config.authEnabled) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    // Reset migration state on sign out
    hasMigrated.current = false;
    setMigrationResult(null);
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: config.authEnabled ? !!user : false,
    authEnabled: config.authEnabled,
    signOut,
    isMigrating,
    migrationResult,
    checkAndMigrateData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
