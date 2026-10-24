import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';

import { authService } from '@/features/auth/services/authService';
import { supabase } from '@/lib/supabase/client';
import type { Profile, UserRole } from '@/types/profile';
import { getFriendlyErrorMessage } from '@/utils/errors';

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  canManageClients: boolean;
  canManageVehicles: boolean;
  canCreateVehicles: boolean;
  canCreateOrders: boolean;
  canManageDiagnostics: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string, redirectTo?: string) => Promise<void>;
  updateProfile: (input: { fullName: string; phone?: string }) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function loadProfile(userId: string): Promise<Profile | null> {
  try {
    return await authService.getProfile(userId);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncSession = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    if (!nextSession?.user) {
      setProfile(null);
      return;
    }
    const nextProfile = await loadProfile(nextSession.user.id);
    setProfile(nextProfile);
  }, []);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const current = await authService.getSession();
        if (!mounted) return;
        await syncSession(current);
      } catch {
        if (mounted) {
          setSession(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void (async () => {
        await syncSession(nextSession);
        setIsLoading(false);
      })();
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [syncSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    const nextSession = await authService.signIn(email, password);
    await syncSession(nextSession);
  }, [syncSession]);

  const signUp = useCallback(
    async (input: {
      fullName: string;
      email: string;
      password: string;
      phone?: string;
    }) => {
      const result = await authService.signUp(input);
      if (result.session) {
        await syncSession(result.session);
      }
      return { needsEmailConfirmation: result.needsEmailConfirmation };
    },
    [syncSession],
  );

  const signOut = useCallback(async () => {
    await authService.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const resetPassword = useCallback(async (email: string, redirectTo?: string) => {
    await authService.resetPassword(email, redirectTo);
  }, []);

  const updateProfile = useCallback(
    async (input: { fullName: string; phone?: string }) => {
      if (!session?.user) {
        throw new Error('Debes iniciar sesión para actualizar tu perfil.');
      }
      const updated = await authService.updateProfile(session.user.id, input);
      setProfile(updated);
    },
    [session],
  );

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return;
    const nextProfile = await loadProfile(session.user.id);
    setProfile(nextProfile);
  }, [session]);

  const role: UserRole | null = profile?.role ?? null;

const value = useMemo<AuthContextValue>(
  () => ({
    session,
    profile,
    isLoading,

    isAuthenticated: Boolean(session?.user),

    isAdmin: role === 'ADMIN',

    canManageClients:
      role === 'ADMIN' ||
      role === 'RECEPCIONISTA',

    canManageVehicles:
      role === 'ADMIN' ||
      role === 'RECEPCIONISTA',

    canCreateVehicles:
      role === 'ADMIN' ||
      role === 'RECEPCIONISTA' ||
      role === 'MECANICO',

    canCreateOrders:
      role === 'ADMIN' ||
      role === 'RECEPCIONISTA' ||
      role === 'MECANICO',

    canManageDiagnostics:
      role === 'ADMIN' ||
      role === 'RECEPCIONISTA' ||
      role === 'MECANICO',

    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
  }),
    [
      session,
      profile,
      isLoading,
      role,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updateProfile,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.');
  }
  return context;
}

export function useAuthErrorMessage(error: unknown): string {
  return getFriendlyErrorMessage(error);
}
