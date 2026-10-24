import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Card,
  ErrorState,
  LoadingState,
  PrimaryButton,
  Screen,
  ScreenHeader,
} from '@/components/ui';

import { clientService } from '@/features/auth/clients/services/cliente_servicios';
import { vehicleService } from '@/features/auth/vehicles/services/vehiculo_servicios';
import type { Vehicle } from '@/features/auth/vehicles/types/vehicle';
import type { Client } from '@/features/auth/clients/types/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { colors, radius, spacing, typography } from '@/theme';
import { getFriendlyErrorMessage } from '@/utils/errors';

export default function ClientDetailScreen() {
  const { canManageClients } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [client, setClient] = useState<Client | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClient = async () => {
    if (!id) {
      setError('No se encontró el identificador del cliente.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await clientService.getById(id);
      setClient(data);

      const vehicleData = await vehicleService.listByClient(data.id);
      setVehicles(vehicleData);
    } catch (err) {
      setError(
        getFriendlyErrorMessage(
          err,
          'No se pudo cargar la información del cliente.',
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadClient();
  }, [id]);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !client) {
    return (
      <Screen>
        <ScreenHeader
          title="Cliente"
          onBack={() => router.back()}
        />

        <ErrorState
          message={
            error ??
            'No se encontró la información del cliente.'
          }
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <ScreenHeader
        title="Cliente"
        subtitle="Información del propietario"
        onBack={() => router.back()}
      />

      <Card style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons
            name="person-outline"
            size={32}
            color={colors.primary}
          />
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.name}>
            {client.full_name}
          </Text>

          <Text style={styles.phone}>
            {client.phone}
          </Text>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>
        Información de contacto
      </Text>

      <Card style={styles.infoCard}>
        <InfoRow
          icon="call-outline"
          label="Teléfono"
          value={client.phone}
        />

        <InfoRow
          icon="mail-outline"
          label="Correo electrónico"
          value={client.email ?? 'No registrado'}
        />

        <InfoRow
          icon="location-outline"
          label="Dirección"
          value={client.address ?? 'No registrada'}
        />
      </Card>

      <Text style={styles.sectionTitle}>
        Vehículos
      </Text>

      {vehicles.length === 0 ? (
        <Card>
          <Text style={styles.emptyVehicles}>
            Este cliente no tiene vehículos registrados.
          </Text>
        </Card>
      ) : (
        <View style={styles.vehicleList}>
          {vehicles.map((vehicle) => (
            <Pressable
              key={vehicle.id}
              onPress={() =>
                router.push(`/vehicles/${vehicle.id}`)
              }
              style={({ pressed }) => [
                styles.vehicleCard,
                pressed && styles.vehiclePressed,
              ]}
            >
              <View style={styles.vehicleIcon}>
                <Ionicons
                  name="car-outline"
                  size={24}
                  color={colors.primary}
                />
              </View>

              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>
                  {vehicle.brand} {vehicle.model}
                </Text>

                <Text style={styles.vehicleDetail}>
                  {vehicle.plate} • {vehicle.year}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
          ))}
        </View>
      )}

      <PrimaryButton
        label="Agregar vehículo"
        onPress={() =>
          router.push({
            pathname: '/vehicles/new',
          })
        }
      />

      <Text style={styles.sectionTitle}>
        Notas
      </Text>

      <Card>
        <Text style={styles.notes}>
          {client.notes ?? 'Sin notas registradas.'}
        </Text>
      </Card>

      {canManageClients ? (
        <View style={styles.actions}>
          <PrimaryButton
            label="Editar cliente"
            onPress={() =>
              router.push({
                pathname: '/clients/[id]/edit',
                params: {
                  id: client.id,
                },
              })
            }
          />
        </View>
      ) : null}
    </Screen>
  );
}

type InfoRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

function InfoRow({
  icon,
  label,
  value,
}: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons
          name={icon}
          size={20}
          color={colors.primary}
        />
      </View>

      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>
          {label}
        </Text>

        <Text style={styles.infoValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightBlue,
  },

  profileInfo: {
    flex: 1,
    gap: spacing.xs,
  },

  name: {
    color: colors.navy,
    fontSize: typography.size.lg,
    fontWeight: '700',
  },

  phone: {
    color: colors.textSecondary,
    fontSize: typography.size.md,
  },

  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    color: colors.navy,
    fontSize: typography.size.md,
    fontWeight: '700',
  },

  infoCard: {
    gap: spacing.lg,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightBlue,
  },

  infoContent: {
    flex: 1,
    gap: spacing.xs,
  },

  infoLabel: {
    color: colors.textMuted,
    fontSize: typography.size.sm,
  },

  infoValue: {
    color: colors.textPrimary,
    fontSize: typography.size.md,
  },

  notes: {
    color: colors.textSecondary,
    fontSize: typography.size.md,
    lineHeight: 22,
  },

  actions: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },

  vehicleList: {
    gap: spacing.sm,
  },

  vehicleCard: {
    minHeight: 72,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },

  vehiclePressed: {
    opacity: 0.7,
  },

  vehicleIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightBlue,
  },

  vehicleInfo: {
    flex: 1,
    gap: spacing.xs,
  },

  vehicleName: {
    color: colors.navy,
    fontSize: typography.size.md,
    fontWeight: '700',
  },

  vehicleDetail: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
  },

  emptyVehicles: {
    color: colors.textSecondary,
    fontSize: typography.size.md,
  },
});

