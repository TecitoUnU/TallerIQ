import { supabase } from '@/lib/supabase/client';

import type {
  AppRole,
  UserProfile,
} from '@/features/users/types/user';

export const userService = {

  async listUsers():
    Promise<UserProfile[]> {

    const {
      data,
      error,
    } =
      await supabase
        .from('profiles')
        .select('*')
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


  async changeRole(
    userId: string,
    role: AppRole,
  ): Promise<void> {

    const {
      error,
    } =
      await supabase.rpc(
        'admin_set_user_role',
        {
          target_user_id:
            userId,

          new_role:
            role,
        },
      );

    if (error) {
      throw error;
    }
  },

};