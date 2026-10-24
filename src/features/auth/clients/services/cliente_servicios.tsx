import type {
  Client,
  ClientFormValues,
} from '@/features/auth/clients/types/client';

import { supabase } from '@/lib/supabase/client';

function nullable(
  value: string,
): string | null {
  const trimmed =
    value.trim();

  return trimmed.length > 0
    ? trimmed
    : null;
}

export const clientService = {
  async list(): Promise<Client[]> {
    const {
      data,
      error,
    } =
      await supabase
        .from('clients')
        .select('*')
        .is(
          'deleted_at',
          null,
        )
        .order(
          'full_name',
          {
            ascending: true,
          },
        );

    if (error) {
      throw error;
    }

    return data;
  },

  async getById(
    id: string,
  ): Promise<Client> {
    const {
      data,
      error,
    } =
      await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .is(
          'deleted_at',
          null,
        )
        .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async create(
    values: ClientFormValues,
  ): Promise<Client> {
    const {
      data: {
        user,
      },
      error: authError,
    } =
      await supabase.auth
        .getUser();

    if (authError) {
      throw authError;
    }

    if (!user) {
      throw new Error(
        'Debes iniciar sesión para registrar un cliente.',
      );
    }

    const {
      data,
      error,
    } =
      await supabase
        .from('clients')
        .insert({
          full_name:
            values.fullName.trim(),

          phone:
            values.phone.trim(),

          email:
            nullable(
              values.email,
            ),

          address:
            nullable(
              values.address,
            ),

          notes:
            nullable(
              values.notes,
            ),

          created_by:
            user.id,
        })
        .select('*')
        .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async update(
    id: string,
    values: ClientFormValues,
  ): Promise<Client> {
    const {
      data,
      error,
    } =
      await supabase
        .from('clients')
        .update({
          full_name:
            values.fullName.trim(),

          phone:
            values.phone.trim(),

          email:
            nullable(
              values.email,
            ),

          address:
            nullable(
              values.address,
            ),

          notes:
            nullable(
              values.notes,
            ),
        })
        .eq('id', id)
        .is(
          'deleted_at',
          null,
        )
        .select('*')
        .single();

    if (error) {
      throw error;
    }

    return data;
  },

};