import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

import { useAuth } from '@/features/auth/hooks/useAuth';

import { VehicleForm } from '@/features/auth/vehicles/components/vehicle_formulario';
import { vehicleService } from '@/features/auth/vehicles/services/vehiculo_servicios';

import type { VehicleFormValues } from '@/features/auth/vehicles/types/vehicle';

import {
  colors,
  spacing,
} from '@/theme';

export default function NewVehicleScreen() {
  const router = useRouter();

  const {
    canCreateVehicles,
  } = useAuth();

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const handleSubmit = async (
    values: VehicleFormValues,
  ) => {
    try {
      setLoading(true);
      setError(null);

      await vehicleService.create(
        values,
      );

      router.replace('/vehicles');
    } catch (err) {
      console.error(
        'Error creando vehículo:',
        err,
      );

      let message =
        'No se pudo registrar el vehículo.';

      if (
        err &&
        typeof err === 'object' &&
        'code' in err
      ) {
        const errorCode = String(
          err.code,
        );

        if (errorCode === '23505') {
          message =
            'Ya existe un vehículo registrado con esta placa.';
        }
      }

      if (
        err &&
        typeof err === 'object' &&
        'message' in err &&
        !('code' in err)
      ) {
        message = String(
          err.message,
        );
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!canCreateVehicles) {
    return (
      <Screen>
        <ScreenHeader
          title="Nuevo vehículo"
          onBack={() =>
            router.back()
          }
        />

        <View
          style={
            styles.permissionContainer
          }
        >
          <Text
            style={
              styles.permissionTitle
            }
          >
            Sin permiso
          </Text>

          <Text
            style={
              styles.permissionText
            }
          >
            Tu usuario no tiene permiso
            para registrar vehículos.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <ScreenHeader
        title="Nuevo vehículo"
        subtitle="Registra un vehículo para un cliente"
        onBack={() =>
          router.back()
        }
      />

      <View
        style={
          styles.container
        }
      >
        {error ? (
          <Text
            style={
              styles.error
            }
          >
            {error}
          </Text>
        ) : null}

        <VehicleForm
          submitLabel="Registrar vehículo"
          loading={loading}
          onSubmit={
            handleSubmit
          }
        />
      </View>
    </Screen>
  );
}

const styles =
  StyleSheet.create({
    container: {
      paddingBottom:
        spacing.xl,
    },

    permissionContainer: {
      padding:
        spacing.lg,
    },

    permissionTitle: {
      color:
        colors.error,

      fontSize: 20,

      fontWeight: '700',

      marginBottom:
        spacing.sm,
    },

    permissionText: {
      color:
        colors.textMuted,

      lineHeight: 22,
    },

    error: {
      color:
        colors.error,

      marginBottom:
        spacing.md,
    },
  });