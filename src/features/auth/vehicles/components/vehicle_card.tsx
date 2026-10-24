import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import type { Vehicle } from '@/features/auth/vehicles/types/vehicle';
import { colors, spacing, typography } from '@/theme';

type Props = {
  vehicle: Vehicle;
  onPress?: () => void;
};

export function VehicleCard({ vehicle, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <Card>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.plate}>
              {vehicle.plate}
            </Text>

            <Text style={styles.year}>
              {vehicle.year}
            </Text>
          </View>

          <Text style={styles.vehicleName}>
            {vehicle.brand} {vehicle.model}
          </Text>

          <Text style={styles.detail}>
            Kilometraje: {vehicle.mileage.toLocaleString()} km
          </Text>

          {vehicle.color && (
            <Text style={styles.detail}>
              Color: {vehicle.color}
            </Text>
          )}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  plate: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.primary,
  },

  year: {
    fontSize: typography.size.md,
    color: colors.textSecondary,
  },

  vehicleName: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: colors.primary,
  },

  detail: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
});