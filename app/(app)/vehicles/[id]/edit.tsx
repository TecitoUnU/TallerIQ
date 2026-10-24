import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { VehicleForm } from '@/features/auth/vehicles/components/vehicle_formulario';
import { vehicleService } from '@/features/auth/vehicles/services/vehiculo_servicios';
import type {
  Vehicle,
  VehicleFormValues,
} from '@/features/auth/vehicles/types/vehicle';
import { spacing, typography } from '@/theme';

export default function EditVehicleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVehicle = useCallback(async () => {
    if (!id) {
      setError('No se encontró el vehículo.');
      setLoading(false);
      return;
    }

    try {
      setError(null);

      const data = await vehicleService.getById(id);

      setVehicle(data);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar el vehículo.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadVehicle();
  }, [loadVehicle]);

  const handleSubmit = async (values: VehicleFormValues) => {
    if (!id) {
      return;
    }

    try {
      setSaving(true);

      await vehicleService.update(id, values);

      router.replace(`/vehicles/${id}`);
    } catch (err) {
      console.error(err);
      setError('No se pudo actualizar el vehículo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <ScreenHeader
          title="Editar vehículo"
          onBack={() => router.back()}
        />

        <View style={styles.center}>
          <Text style={styles.message}>
            Cargando vehículo...
          </Text>
        </View>
      </Screen>
    );
  }

  if (error || !vehicle) {
    return (
      <Screen>
        <ScreenHeader
          title="Editar vehículo"
          onBack={() => router.back()}
        />

        <ErrorState
          message={error ?? 'No se encontró el vehículo.'}
        />
      </Screen>
    );
  }

  const initialValues: VehicleFormValues = {
  clientId: vehicle.client_id,
  plate: vehicle.plate,
  brand: vehicle.brand,
  model: vehicle.model,
  year: String(vehicle.year ?? ''),
  mileage: String(vehicle.mileage ?? ''),
  color: vehicle.color ?? '',
  vin: vehicle.vin ?? '',
  notes: vehicle.notes ?? '',
  photoUrl: vehicle.photo_url ?? '',
};

  return (
    <Screen scroll>
      <ScreenHeader
        title="Editar vehículo"
        subtitle={`${vehicle.brand} ${vehicle.model}`}
        onBack={() => router.back()}
      />

      <View style={styles.container}>
        <VehicleForm
          initialValues={initialValues}
          submitLabel="Guardar cambios"
          loading={saving}
          onSubmit={handleSubmit}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xl,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  message: {
    fontSize: typography.size.md,
  },
});