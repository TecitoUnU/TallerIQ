import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { clientService } from '@/features/auth/clients/services/cliente_servicios';
import type { Client } from '@/features/auth/clients/types/client';
import { vehicleService } from '@/features/auth/vehicles/services/vehiculo_servicios';
import type { Vehicle } from '@/features/auth/vehicles/types/vehicle';
import { supabase } from '@/lib/supabase/client';
import { colors, radius, spacing, typography } from '@/theme';

export default function VehicleDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  const [generatingHistory, setGeneratingHistory] = useState(false);
  const [historySummary, setHistorySummary] = useState('');
  const [historyError, setHistoryError] = useState('');

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

      const clientData = await clientService.getById(data.client_id);
      setClient(clientData);
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

  const handleGenerateHistory = async () => {
    if (!vehicle || generatingHistory) {
      return;
    }

    try {
      setGeneratingHistory(true);
      setHistoryError('');
      setHistorySummary('');

      const { data, error } = await supabase.functions.invoke(
        'summarize-history',
        {
          body: { vehicleId: vehicle.id },
        },
      );

      if (error) {
        throw error;
      }

      if (!data?.summary) {
        throw new Error(
          data?.error || 'La IA no devolvió un resumen.',
        );
      }

      setHistorySummary(data.summary);
    } catch (err) {
      console.error('Error generando historial:', err);
      setHistoryError(
        'No se pudo generar el historial. Revisa la conexión y los registros de Supabase.',
      );
    } finally {
      setGeneratingHistory(false);
    }
  };

  const handleArchive = async () => {
    if (!vehicle || archiving) {
      return;
    }

    const confirmed = window.confirm(
      `¿Seguro que deseas archivar el vehículo ${vehicle.plate}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setArchiving(true);

      await vehicleService.archive(vehicle.id);

      window.alert(
        `El vehículo ${vehicle.plate} fue archivado correctamente.`,
      );

      router.replace('/vehicles');
    } catch (err) {
      console.error('ARCHIVE ERROR:', err);
      window.alert('No se pudo archivar el vehículo.');
    } finally {
      setArchiving(false);
    }
  };

  if (loading) {
    return (
      <Screen scroll>
        <ScreenHeader title="Vehículo" />
        <View style={styles.center}>
          <Text style={styles.message}>Cargando vehículo...</Text>
        </View>
      </Screen>
    );
  }

  if (error || !vehicle) {
    return (
      <Screen scroll>
        <ScreenHeader title="Vehículo" />
        <ErrorState message={error ?? 'No se encontró el vehículo.'} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <ScreenHeader
        title="Detalle del vehículo"
        subtitle={`${vehicle.brand} ${vehicle.model}`}
        onBack={() => router.back()}
      />

      {vehicle.photo_url ? (
        <Image
          source={{ uri: vehicle.photo_url }}
          style={styles.vehiclePhoto}
          resizeMode="cover"
        />
      ) : null}

      <View style={styles.container}>
        <Card>
          <View style={styles.section}>
            <Text style={styles.plate}>{vehicle.plate}</Text>

            <Text style={styles.vehicleName}>
              {vehicle.brand} {vehicle.model}
            </Text>

            <View style={styles.details}>
              <View>
                <Text style={styles.label}>Año</Text>
                <Text style={styles.value}>{vehicle.year}</Text>
              </View>

              <View>
                <Text style={styles.label}>Kilometraje</Text>
                <Text style={styles.value}>
                  {vehicle.mileage.toLocaleString()} km
                </Text>
              </View>

              {vehicle.color ? (
                <View>
                  <Text style={styles.label}>Color</Text>
                  <Text style={styles.value}>{vehicle.color}</Text>
                </View>
              ) : null}

              {vehicle.vin ? (
                <View>
                  <Text style={styles.label}>VIN</Text>
                  <Text style={styles.value}>{vehicle.vin}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </Card>

        {client ? (
          <>
            <Text style={styles.sectionTitle}>Propietario</Text>

            <Card>
              <View style={styles.ownerRow}>
                <View style={styles.ownerIcon}>
                  <Ionicons
                    name="person-outline"
                    size={24}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.ownerInfo}>
                  <Text style={styles.ownerName}>{client.full_name}</Text>
                  <Text style={styles.ownerPhone}>{client.phone}</Text>
                </View>
              </View>

              <PrimaryButton
                label="Ver cliente"
                onPress={() => router.push(`/clients/${client.id}`)}
              />
            </Card>
          </>
        ) : null}

        <Card>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Historial inteligente con IA
            </Text>

            <Text style={styles.historyDescription}>
              Genera un resumen de las órdenes y diagnósticos registrados
              para este vehículo.
            </Text>

            <PrimaryButton
              label={
                generatingHistory
                  ? 'Generando historial...'
                  : 'Generar historial con IA'
              }
              onPress={handleGenerateHistory}
              disabled={generatingHistory}
            />

            {historyError ? (
              <Text style={styles.historyError}>{historyError}</Text>
            ) : null}

            {historySummary ? (
              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>
                  Resumen del vehículo
                </Text>

                <Markdown style={markdownStyles}>
                  {historySummary
                    .replace(/\\\*/g, '*')
                    .replace(/\\n/g, '\n')}
                </Markdown>
              </View>
            ) : null}
          </View>
        </Card>

        <View style={styles.actions}>
          <PrimaryButton
            label="Editar vehículo"
            onPress={() => router.push(`/vehicles/${vehicle.id}/edit`)}
          />

          <Pressable
            onPress={handleArchive}
            disabled={archiving}
            style={({ pressed }) => [
              styles.archiveButton,
              pressed && styles.archivePressed,
              archiving && styles.archiveDisabled,
            ]}
          >
            <Ionicons
              name="archive-outline"
              size={20}
              color={colors.primary}
            />

            <Text style={styles.archiveText}>
              {archiving ? 'Archivando...' : 'Archivar vehículo'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const markdownStyles = {
  body: {
    color: '#243247',
    fontSize: 14,
    lineHeight: 22,
  },
  heading1: {
    color: '#123B63',
    fontSize: 20,
    fontWeight: 'bold' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  heading2: {
    color: '#123B63',
    fontSize: 17,
    fontWeight: 'bold' as const,
    marginTop: 14,
    marginBottom: 6,
  },
  heading3: {
    color: '#123B63',
    fontSize: 15,
    fontWeight: 'bold' as const,
    marginTop: 10,
    marginBottom: 5,
  },
  strong: {
    fontWeight: 'bold' as const,
    color: '#172B4D',
  },
  bullet_list: {
    marginBottom: 8,
  },
  ordered_list: {
    marginBottom: 8,
  },
  list_item: {
    marginBottom: 5,
  },
  paragraph: {
    marginTop: 3,
    marginBottom: 8,
  },
  hr: {
    backgroundColor: '#D9E2EC',
    height: 1,
    marginTop: 10,
    marginBottom: 10,
  },
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.md,
  },
  plate: {
    fontSize: typography.size.xl,
    fontWeight: '700',
    color: colors.primary,
  },
  vehicleName: {
    fontSize: typography.size.lg,
    fontWeight: '600',
  },
  details: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  label: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  value: {
    fontSize: typography.size.md,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: typography.size.md,
  },
  actions: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  archiveButton: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  archivePressed: {
    opacity: 0.7,
  },
  archiveDisabled: {
    opacity: 0.5,
  },
  archiveText: {
    color: colors.primary,
    fontSize: typography.size.md,
    fontWeight: '700',
  },
  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    color: colors.navy,
    fontSize: typography.size.md,
    fontWeight: '700',
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  ownerIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightBlue,
  },
  ownerInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  ownerName: {
    color: colors.navy,
    fontSize: typography.size.md,
    fontWeight: '700',
  },
  ownerPhone: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
  },
  vehiclePhoto: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  historyDescription: {
    fontSize: typography.size.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  historyError: {
    color: 'red',
    fontSize: typography.size.sm,
  },
  summaryBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.lightBlue,
    gap: spacing.sm,
  },
  summaryTitle: {
    color: colors.navy,
    fontSize: typography.size.md,
    fontWeight: '700',
  },
});