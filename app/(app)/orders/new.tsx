import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

import { useAuth } from '@/features/auth/hooks/useAuth';

import { vehicleService } from '@/features/auth/vehicles/services/vehiculo_servicios';
import type { Vehicle } from '@/features/auth/vehicles/types/vehicle';

import { orderService } from '@/features/auth/orders/services/orden_servicios';
import type { WorkOrderPriority } from '@/features/auth/orders/services/types/order';

import {
  mechanicService,
  type Mechanic,
} from '@/features/auth/orders/services/mecanico_servicios';

import { colors, spacing } from '@/theme';

const priorities: {
  label: string;
  value: WorkOrderPriority;
}[] = [
  { label: 'Baja', value: 'LOW' },
  { label: 'Media', value: 'MEDIUM' },
  { label: 'Alta', value: 'HIGH' },
  { label: 'Urgente', value: 'URGENT' },
];

export default function NewOrderScreen() {
  const router = useRouter();

  const {
    canCreateOrders,
  } = useAuth();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] =
    useState<Vehicle | null>(null);

  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [selectedMechanic, setSelectedMechanic] =
    useState<Mechanic | null>(null);

  const [mileage, setMileage] = useState('');
  const [problem, setProblem] = useState('');
  const [priority, setPriority] =
    useState<WorkOrderPriority>('MEDIUM');

  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingMechanics, setLoadingMechanics] = useState(true);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [mechanicsError, setMechanicsError] =
    useState<string | null>(null);

  const [formError, setFormError] =
    useState<string | null>(null);

  const showError = (message: string) => {
    setFormError(message);

    if (Platform.OS !== 'web') {
      Alert.alert('Atención', message);
    }
  };

  const loadVehicles = useCallback(async () => {
    try {
      setLoadingVehicles(true);
      setError(null);

      const data = await vehicleService.list();

      setVehicles(data);
    } catch (err) {
      console.error('Error al cargar vehículos:', err);

      setError('No se pudieron cargar los vehículos.');
    } finally {
      setLoadingVehicles(false);
    }
  }, []);

  const loadMechanics = useCallback(async () => {
    try {
      setLoadingMechanics(true);
      setMechanicsError(null);

      const data = await mechanicService.list();

      setMechanics(data);
    } catch (err) {
      console.error('Error al cargar mecánicos:', err);

      setMechanicsError(
        'No se pudieron cargar los mecánicos.',
      );
    } finally {
      setLoadingMechanics(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadVehicles();
      void loadMechanics();
    }, [loadVehicles, loadMechanics]),
  );

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      router.replace('/orders');
    }, 2000);

    return () => clearTimeout(timer);
  }, [success, router]);

  const handleCreateOrder = async () => {
    if (saving || success) return;

    setFormError(null);

    if (!selectedVehicle) {
      showError('Selecciona un vehículo.');
      return;
    }

    if (
      !mileage.trim() ||
      !/^\d+$/.test(mileage.trim())
    ) {
      showError(
        'Ingresa el kilometraje actual usando números enteros.',
      );

      return;
    }

    const currentMileage = Number(mileage.trim());

    if (!Number.isSafeInteger(currentMileage)) {
      showError(
        'El kilometraje ingresado es demasiado grande.',
      );

      return;
    }

    if (!problem.trim()) {
      showError(
        'Describe el problema reportado por el cliente.',
      );

      return;
    }

    if (!selectedMechanic) {
      showError(
        'Selecciona el mecánico responsable.',
      );

      return;
    }

    try {
      setSaving(true);

      await orderService.create({
        vehicle_id: selectedVehicle.id,

        client_id: selectedVehicle.client_id,

        current_mileage: currentMileage,

        reported_problem: problem.trim(),

        priority,

        assigned_mechanic_id: selectedMechanic.id,
      });

      setSuccess(true);
    } catch (err) {
      console.error(
        'Error al crear la orden:',
        err,
      );

      showError(
        'No se pudo guardar la orden. Revisa la consola y los permisos de Supabase.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (!canCreateOrders) {
    return (
      <Screen>
        <ScreenHeader
          title="Nueva orden"
          subtitle="Registrar ingreso de vehículo"
          onBack={() => router.back()}
        />

        <View
          style={styles.permissionContainer}
        >
          <Text
            style={styles.permissionTitle}
          >
            Sin permiso
          </Text>

          <Text
            style={styles.permissionText}
          >
            Tu usuario no tiene permiso para
            crear órdenes de trabajo.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      {success && (
        <View style={styles.successBox}>
          <Text style={styles.successTitle}>
            ✓ ¡Orden creada correctamente!
          </Text>

          <Text style={styles.successText}>
            La orden se guardó con un mecánico
            asignado. Redirigiendo a la lista de
            órdenes...
          </Text>
        </View>
      )}

      <ScreenHeader
        title="Nueva orden"
        subtitle="Registrar ingreso de vehículo"
        onBack={() => router.back()}
      />

      {formError && (
        <View style={styles.errorBox}>
          <Text style={styles.error}>
            {formError}
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>
        1. Seleccionar vehículo
      </Text>

      {loadingVehicles ? (
        <ActivityIndicator
          color={colors.primary}
        />
      ) : error ? (
        <View>
          <Text style={styles.error}>
            {error}
          </Text>

          <Pressable
            onPress={() =>
              void loadVehicles()
            }
          >
            <Text style={styles.retryText}>
              Reintentar
            </Text>
          </Pressable>
        </View>
      ) : vehicles.length === 0 ? (
        <Text style={styles.help}>
          No hay vehículos registrados. Registra
          un vehículo antes de crear una orden.
        </Text>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const selected =
              selectedVehicle?.id === item.id;

            return (
              <Pressable
                disabled={saving || success}
                onPress={() =>
                  setSelectedVehicle(item)
                }
                style={[
                  styles.vehicleCard,
                  selected &&
                    styles.vehicleSelected,
                ]}
              >
                <View
                  style={
                    styles.vehicleText
                  }
                >
                  <Text
                    style={
                      styles.vehicleTitle
                    }
                  >
                    {item.brand} {item.model}
                  </Text>

                  <Text style={styles.help}>
                    Placa: {item.plate}
                  </Text>
                </View>

                <Text
                  style={
                    styles.selectText
                  }
                >
                  {selected
                    ? 'Seleccionado ✓'
                    : 'Seleccionar'}
                </Text>
              </Pressable>
            );
          }}
        />
      )}

      {selectedVehicle && (
        <View style={styles.selectedInfo}>
          <Text style={styles.help}>
            Vehículo seleccionado:{' '}
            {selectedVehicle.plate}
          </Text>

          <Text style={styles.help}>
            El cliente se asociará
            automáticamente a esta orden.
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>
        2. Datos de recepción
      </Text>

      <Text style={styles.label}>
        Kilometraje actual
      </Text>

      <TextInput
        value={mileage}
        onChangeText={setMileage}
        placeholder="Ej. 85400"
        placeholderTextColor={
          colors.textMuted
        }
        keyboardType="number-pad"
        style={styles.input}
        editable={!saving && !success}
      />

      <Text style={styles.label}>
        Problema reportado
      </Text>

      <TextInput
        value={problem}
        onChangeText={setProblem}
        placeholder="Describe el problema del vehículo..."
        placeholderTextColor={
          colors.textMuted
        }
        multiline
        textAlignVertical="top"
        style={[
          styles.input,
          styles.problemInput,
        ]}
        editable={!saving && !success}
      />

      <Text style={styles.sectionTitle}>
        3. Asignar mecánico
      </Text>

      <Text style={styles.help}>
        Selecciona al mecánico responsable de
        esta orden.
      </Text>

      {loadingMechanics ? (
        <ActivityIndicator
          color={colors.primary}
        />
      ) : mechanicsError ? (
        <View>
          <Text style={styles.error}>
            {mechanicsError}
          </Text>

          <Pressable
            onPress={() =>
              void loadMechanics()
            }
          >
            <Text style={styles.retryText}>
              Reintentar
            </Text>
          </Pressable>
        </View>
      ) : mechanics.length === 0 ? (
        <View style={styles.notice}>
          <Text style={styles.error}>
            No hay mecánicos disponibles.
          </Text>

          <Text style={styles.help}>
            Comprueba que exista un usuario con
            rol MECANICO y que tu sesión tenga
            permiso para consultarlo.
          </Text>
        </View>
      ) : (
        <View>
          {mechanics.map(mechanic => {
            const selected =
              selectedMechanic?.id ===
              mechanic.id;

            return (
              <Pressable
                key={mechanic.id}
                disabled={saving || success}
                onPress={() =>
                  setSelectedMechanic(
                    mechanic,
                  )
                }
                style={[
                  styles.mechanicCard,
                  selected &&
                    styles.mechanicSelected,
                ]}
              >
                <View
                  style={
                    styles.vehicleText
                  }
                >
                  <Text
                    style={
                      styles.mechanicName
                    }
                  >
                    {mechanic.full_name}
                  </Text>

                  {mechanic.email && (
                    <Text
                      style={
                        styles.help
                      }
                    >
                      {mechanic.email}
                    </Text>
                  )}
                </View>

                <Text
                  style={
                    styles.selectText
                  }
                >
                  {selected
                    ? 'Asignado ✓'
                    : 'Asignar'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {selectedMechanic && (
        <View style={styles.selectedInfo}>
          <Text style={styles.help}>
            Mecánico asignado:{' '}
            {selectedMechanic.full_name}
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>
        4. Prioridad
      </Text>

      <View
        style={
          styles.priorityContainer
        }
      >
        {priorities.map(item => {
          const selected =
            priority === item.value;

          return (
            <Pressable
              key={item.value}
              disabled={saving || success}
              onPress={() =>
                setPriority(item.value)
              }
              style={[
                styles.priorityButton,
                selected &&
                  styles.prioritySelected,
              ]}
            >
              <Text
                style={[
                  styles.priorityText,
                  selected &&
                    styles.priorityTextSelected,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>
          Estado inicial
        </Text>

        <Text style={styles.help}>
          La orden se creará con estado RECIBIDO.
        </Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          label={
            saving
              ? 'Guardando...'
              : 'Crear orden'
          }
          onPress={() =>
            void handleCreateOrder()
          }
        />

        <Pressable
          disabled={saving || success}
          onPress={() => router.back()}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelText}>
            Cancelar
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  permissionContainer: {
    padding: spacing.lg,
  },

  permissionTitle: {
    color: '#C62828',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },

  permissionText: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 22,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: spacing.sm,
  },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    color: '#000',
    backgroundColor: colors.surface,
    fontSize: 20,
  },

  problemInput: {
    minHeight: 110,
  },

  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },

  vehicleSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },

  vehicleText: {
    flex: 1,
  },

  vehicleTitle: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },

  selectText: {
    color: colors.primary,
    fontWeight: '600',
  },

  selectedInfo: {
    padding: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.surface,
    marginTop: spacing.sm,
  },

  help: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: spacing.xs,
  },

  error: {
    color: '#C62828',
    fontSize: 15,
  },

  errorBox: {
    backgroundColor: '#FDECEC',
    padding: spacing.md,
    borderRadius: 10,
    marginVertical: spacing.sm,
  },

  retryText: {
    color: colors.primary,
    fontWeight: '700',
    marginTop: spacing.sm,
  },

  mechanicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    marginTop: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },

  mechanicSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: '#EAF2FF',
  },

  mechanicName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
  },

  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  priorityButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },

  prioritySelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  priorityText: {
    color: '#000',
    fontWeight: '600',
  },

  priorityTextSelected: {
    color: '#FFF',
  },

  notice: {
    padding: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.surface,
    marginTop: spacing.md,
  },

  noticeTitle: {
    color: '#000',
    fontWeight: '700',
  },

  actions: {
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: 50,
  },

  cancelButton: {
    alignItems: 'center',
    padding: spacing.md,
  },

  cancelText: {
    color: colors.textMuted,
    fontWeight: '600',
  },

  successBox: {
    backgroundColor: '#D4EDDA',
    borderColor: '#28A745',
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },

  successTitle: {
    color: '#155724',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  successText: {
    color: '#155724',
    fontSize: 15,
    textAlign: 'center',
  },
});