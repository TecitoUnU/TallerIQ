import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase/client';
import type { Profile } from '@/types/profile';
import { getFriendlyErrorMessage } from '@/utils/errors';
import { normalizeOptional, trimOrEmpty } from '@/utils/string';

export type AuthResult<T> = { data: T; error: null } | { data: null; error: string };

async function mapAuthError(error: unknown): Promise<never> {
  throw new Error(getFriendlyErrorMessage(error));
}

export const authService = {
  async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      await mapAuthError(error);
    }
    return data.session;
  },

  async getUser(): Promise<User | null> {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      return null;
    }
    return data.user;
  },

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(getFriendlyErrorMessage(error, 'No se pudo cargar el perfil.'));
    }

    return data;
  },

  async signIn(email: string, password: string): Promise<Session> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimOrEmpty(email).toLowerCase(),
      password,
    });

    if (error || !data.session) {
      throw new Error(getFriendlyErrorMessage(error, 'No se pudo iniciar sesión.'));
    }

    return data.session;
  },

  async signUp(input: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ session: Session | null; needsEmailConfirmation: boolean }> {
    const { data, error } = await supabase.auth.signUp({
      email: trimOrEmpty(input.email).toLowerCase(),
      password: input.password,
      options: {
        data: {
          full_name: trimOrEmpty(input.fullName),
          phone: normalizeOptional(input.phone) ?? '',
        },
      },
    });

    if (error) {
      throw new Error(getFriendlyErrorMessage(error, 'No se pudo crear la cuenta.'));
    }

    return {
      session: data.session,
      needsEmailConfirmation: !data.session,
    };
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(getFriendlyErrorMessage(error, 'No se pudo cerrar sesión.'));
    }
  },

  async resetPassword(email: string, redirectTo?: string): Promise<void> {
    const options = redirectTo ? { redirectTo } : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(
      trimOrEmpty(email).toLowerCase(),
      options,
    );

    if (error) {
      throw new Error(
        getFriendlyErrorMessage(error, 'No se pudo enviar el correo de recuperación.'),
      );
    }
  },

  async updateProfile(
    userId: string,
    input: { fullName: string; phone?: string },
  ): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: trimOrEmpty(input.fullName),
        phone: normalizeOptional(input.phone),
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(getFriendlyErrorMessage(error, 'No se pudo actualizar el perfil.'));
    }

    return data;
  },
};
