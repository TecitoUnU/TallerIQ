import * as Crypto from 'expo-crypto';

import type {
  Vehicle,
  VehicleFormValues,
} from '@/features/auth/vehicles/types/vehicle';

import { supabase } from '@/lib/supabase/client';

async function uploadVehiclePhoto(
  uri: string,
  vehicleId: string,
): Promise<string> {
  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();

  const filePath = `vehicles/${vehicleId}.jpg`;

  const { error: uploadError } =
    await supabase.storage
      .from('vehicle-photos')
      .upload(filePath, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

  if (uploadError) {
    throw uploadError;
  }

  const { data } =
    supabase.storage
      .from('vehicle-photos')
      .getPublicUrl(filePath);

  return data.publicUrl;
}

export const vehicleService = {
  async list(): Promise<Vehicle[]> {
    const { data, error } =
      await supabase
        .from('vehicles')
        .select('*')
        .is('deleted_at', null)
        .order('plate', {
          ascending: true,
        });

    if (error) {
      throw error;
    }

    return data ?? [];
  },

  async listByClient(
    clientId: string,
  ): Promise<Vehicle[]> {
    const { data, error } =
      await supabase
        .from('vehicles')
        .select('*')
        .eq('client_id', clientId)
        .is('deleted_at', null)
        .order('plate', {
          ascending: true,
        });

    if (error) {
      throw error;
    }

    return data ?? [];
  },

  async getById(
    id: string,
  ): Promise<Vehicle> {
    const { data, error } =
      await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async create(
    values: VehicleFormValues,
  ): Promise<string> {
    const vehicleId =
      Crypto.randomUUID();

    const { error } =
      await supabase
        .from('vehicles')
        .insert({
          id: vehicleId,

          client_id:
            values.clientId,

          plate:
            values.plate
              .trim()
              .toUpperCase(),

          brand:
            values.brand.trim(),

          model:
            values.model.trim(),

       year: Number(values.year),

          mileage:
            values.mileage
              ? Number(values.mileage)
              : 0,

          color:
            values.color.trim() ||
            null,

          vin:
            values.vin.trim() ||
            null,

          notes:
            values.notes.trim() ||
            null,
        });

    if (error) {
      console.error(
        'VEHICLE CREATE ERROR:',
        error,
      );

      throw error;
    }

    if (values.photoUrl) {
      const photoUrl =
        await uploadVehiclePhoto(
          values.photoUrl,
          vehicleId,
        );

      const {
        error: updateError,
      } = await supabase
        .from('vehicles')
        .update({
          photo_url: photoUrl,
        })
        .eq('id', vehicleId);

      if (updateError) {
        console.error(
          'VEHICLE PHOTO UPDATE ERROR:',
          updateError,
        );

        throw updateError;
      }
    }

    return vehicleId;
  },

  async update(
    id: string,
    values: VehicleFormValues,
  ): Promise<Vehicle> {
    const { data, error } =
      await supabase
        .from('vehicles')
        .update({
          client_id:
            values.clientId,

          plate:
            values.plate
              .trim()
              .toUpperCase(),

          brand:
            values.brand.trim(),

          model:
            values.model.trim(),

          year:
            values.year
              ? Number(values.year)
              : undefined,

          mileage:
            values.mileage
              ? Number(values.mileage)
              : 0,

          color:
            values.color.trim() ||
            null,

          vin:
            values.vin.trim() ||
            null,

          notes:
            values.notes.trim() ||
            null,
        })
        .eq('id', id)
        .is('deleted_at', null)
        .select('*')
        .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async archive(
    id: string,
  ): Promise<void> {
    const { error } =
      await supabase
        .from('vehicles')
        .update({
          deleted_at:
            new Date().toISOString(),
        })
        .eq('id', id);

    if (error) {
      console.error(
        'ARCHIVE ERROR:',
        error,
      );

      throw error;
    }
  },
};
