import type { Database } from '@/types/database';

export type Vehicle =
  Database['public']['Tables']['vehicles']['Row'];

export type VehicleInsert =
  Database['public']['Tables']['vehicles']['Insert'];

export type VehicleUpdate =
  Database['public']['Tables']['vehicles']['Update'];

export type VehicleFormValues = {
  clientId: string;
  plate: string;
  brand: string;
  model: string;
  year: string;
  mileage: string;
  color: string;
  vin: string;
  notes: string;
  photoUrl: string;
};