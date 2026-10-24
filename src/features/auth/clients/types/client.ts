import type { Database } from '@/types/database';

export type Client =
  Database['public']['Tables']['clients']['Row'];

export type ClientInsert =
  Database['public']['Tables']['clients']['Insert'];

export type ClientUpdate =
  Database['public']['Tables']['clients']['Update'];

export type ClientFormValues = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};