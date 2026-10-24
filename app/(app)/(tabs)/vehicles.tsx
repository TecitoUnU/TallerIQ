import { useCallback, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { ErrorState } from '@/components/ui/ErrorState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { VehicleCard } from '@/features/auth/vehicles/components/vehicle_card';
import { vehicleService } from '@/features/auth/vehicles/services/vehiculo_servicios';
import type { Vehicle } from '@/features/auth/vehicles/types/vehicle';
import { colors, spacing, typography } from '@/theme';

export default function VehiclesScreen() {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVehicles = useCallback(async () => {
    try {
      setError(null);

      const data = await vehicleService.list();

      setVehicles(data);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los vehículos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadVehicles();
    }, [loadVehicles])
  );

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await loadVehicles();
    } finally {
      setRefreshing(false);
    }
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return (
      vehicle.plate.toLowerCase().includes(query) ||
      vehicle.brand.toLowerCase().includes(query) ||
      vehicle.model.toLowerCase().includes(query)
    );
  });

  return (
    <Screen>
      <ScreenHeader
        title="Vehículos"
        subtitle="Administra los vehículos registrados"
      />

      <View style={styles.searchContainer}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por placa, marca o modelo..."
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.buttonContainer}>
        <PrimaryButton
          label="Nuevo vehículo"
          onPress={() => router.push('/vehicles/new')}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text style={styles.message}>
            Cargando vehículos...
          </Text>
        </View>
      ) : error ? (
        <ErrorState message={error} />
      ) : vehicles.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.message}>
            No hay vehículos registrados.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredVehicles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <VehicleCard
              vehicle={item}
              onPress={() => router.push(`/vehicles/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            !loading && !error && search.trim() ? (
              <View style={styles.emptySearch}>
                <Text style={styles.emptySearchTitle}>
                  No encontramos vehículos
                </Text>

                <Text style={styles.emptySearchText}>
                  No hay vehículos que coincidan con "{search.trim()}".
                </Text>
              </View>
            ) : null
          }
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    marginBottom: spacing.lg,
  },

  list: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },

  message: {
    fontSize: typography.size.md,
  },

  searchContainer: {
    marginBottom: spacing.md,
  },

  searchInput: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    color: colors.navy,
    fontSize: typography.size.md,
  },

  emptySearch: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },

  emptySearchTitle: {
    color: colors.navy,
    fontSize: typography.size.md,
    fontWeight: '700',
    textAlign: 'center',
  },

  emptySearchText: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    textAlign: 'center',
  },
});