import type { Database } from '@/types/database';

export type UserProfile =
  Database['public']['Tables']['profiles']['Row'];

export type AppRole =
  Database['public']['Enums']['user_role'];