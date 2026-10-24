
import { useCallback, useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

import { orderService } from '@/features/auth/orders/services/orden_servicios';

import {
  mechanicService,
  type Mechanic,
} from '@/features/auth/orders/services/mecanico_servicios';

import type { WorkOrder } from '@/features/auth/orders/services/types/order';

import { colors, spacing } from '@/theme';

type OrderDetails = WorkOrder & {
  vehicles: {
    id: string;
    plate: string;
    brand: string;
    model: string;
    year: number;
    color: string | null;
    mileage: number;
  } | null;

  clients: {
    id: string;
    full_name: string;
    phone: string;
    email: string | null;
    address: string | null;
  } | null;
};

const statuses: {
  label: string;
  value: WorkOrder['status'];
}[] = [
  { label: 'Recibido', value: 'RECEIVED' },
  { label: 'En diagnóstico', value: 'DIAGNOSIS' },
  { label: 'Esperando aprobación', value: 'WAITING_APPROVAL' },
  { label: 'Aprobado', value: 'APPROVED' },
  { label: 'En reparación', value: 'IN_REPAIR' },
  { label: 'Terminado', value: 'COMPLETED' },
  { label: 'Entregado', value: 'DELIVERED' },
  { label: 'Cancelado', value: 'CANCELLED' },
];

const priorities: Record<WorkOrder['priority'], string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

type ToastData = {
  type: 'success' | 'error';
  title: string;
  message: string;
};

export default function OrderDetailScreen() {
  const router = useRouter();

  const { id } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [mechanicError, setMechanicError] = useState(false);

  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast]);

  const loadOrder = useCallback(async () => {
    if (!id) {
      setError('No se encontró el identificador de la orden.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMechanic(null);
      setMechanicError(false);

      const data = await orderService.getOrderDetails(id);

      setOrder(data);

      if (data.assigned_mechanic_id) {
        try {
          const mechanicData = await mechanicService.getById(
            data.assigned_mechanic_id
          );

          setMechanic(mechanicData);
        } catch (mechanicErr) {
          console.error(
            'Error al consultar mecánico:',
            mechanicErr
          );

          setMechanicError(true);
        }
      }
    } catch (err) {
      console.error('Error al cargar orden:', err);
      setError('No se pudo cargar la orden.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void loadOrder();
    }, [loadOrder])
  );

  const handleUpdateStatus = async (
    newStatus: WorkOrder['status']
  ) => {
    if (!order || saving || order.status === newStatus) {
      return;
    }

    try {
      setSaving(true);
      setToast(null);

      const updatedOrder = await orderService.updateStatus(
        order.id,
        newStatus
      );

      setOrder(previous =>
        previous
          ? { ...previous, ...updatedOrder }
          : null
      );

      const statusName =
        statuses.find(item => item.value === newStatus)?.label ??
        newStatus;

      setToast({
        type: 'success',
        title: 'Estado actualizado',
        message: `La orden ahora está en: ${statusName}.`,
      });
    } catch (err) {
      console.error('Error al actualizar estado:', err);

      setToast({
        type: 'error',
        title: 'Error al actualizar',
        message: 'No se pudo actualizar el estado de la orden.',
      });
    } finally {
      setSaving(false);
    }
  };

  const getMechanicName = () => {
    if (!order?.assigned_mechanic_id) {
      return 'Sin mecánico asignado';
    }

    if (mechanicError) {
      return 'No se pudo consultar el mecánico';
    }

    return mechanic?.full_name ?? 'Mecánico no disponible';
  };

  return (
    <Screen>
      {toast && (
        <View
          style={[
            styles.toast,
            toast.type === 'error' && styles.toastError,
          ]}
        >
          <Text
            style={[
              styles.toastIcon,
              toast.type === 'error' && styles.toastIconError,
            ]}
          >
            {toast.type === 'success' ? '✓' : '!'}
          </Text>

          <View style={styles.toastContent}>
            <Text style={styles.toastTitle}>
              {toast.title}
            </Text>

            <Text style={styles.toastMessage}>
              {toast.message}
            </Text>
          </View>

          <Pressable
            onPress={() => setToast(null)}
            accessibilityRole="button"
            accessibilityLabel="Cerrar notificación"
          >
            <Text style={styles.toastClose}>✕</Text>
          </Pressable>
        </View>
      )}

      <ScreenHeader
        title="Detalle de orden"
        subtitle={order?.order_number ?? 'Cargando...'}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />

          <Text style={styles.info}>
            Cargando orden...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>

          <PrimaryButton
            label="Reintentar"
            onPress={() => void loadOrder()}
          />
        </View>
      ) : !order ? (
        <Text style={styles.error}>
          No se encontró la orden.
        </Text>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Información del vehículo */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Información del vehículo
            </Text>

            <Text style={styles.label}>Marca</Text>
            <Text style={styles.value}>
              {order.vehicles?.brand ?? 'No disponible'}
            </Text>

            <Text style={styles.label}>Modelo</Text>
            <Text style={styles.value}>
              {order.vehicles?.model ?? 'No disponible'}
            </Text>

            <Text style={styles.label}>Año</Text>
            <Text style={styles.value}>
              {order.vehicles?.year ?? 'No disponible'}
            </Text>

            <Text style={styles.label}>Placa</Text>
            <Text style={styles.value}>
              {order.vehicles?.plate ?? 'No disponible'}
            </Text>

            <Text style={styles.label}>Color</Text>
            <Text style={styles.value}>
              {order.vehicles?.color ?? 'No registrado'}
            </Text>

            <Text style={styles.label}>
              Kilometraje de recepción
            </Text>
            <Text style={styles.value}>
              {order.current_mileage} km
            </Text>
          </View>

          {/* Información del cliente */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Información del cliente
            </Text>

            <Text style={styles.label}>
              Nombre completo
            </Text>
            <Text style={styles.value}>
              {order.clients?.full_name ?? 'No disponible'}
            </Text>

            <Text style={styles.label}>Teléfono</Text>
            <Text style={styles.value}>
              {order.clients?.phone ?? 'No disponible'}
            </Text>

            <Text style={styles.label}>
              Correo electrónico
            </Text>
            <Text style={styles.value}>
              {order.clients?.email ?? 'No registrado'}
            </Text>

            <Text style={styles.label}>Dirección</Text>
            <Text style={styles.value}>
              {order.clients?.address ?? 'No registrada'}
            </Text>
          </View>

          {/* Mecánico asignado */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Mecánico asignado
            </Text>

            <Text style={styles.label}>
              Nombre del mecánico
            </Text>
            <Text style={styles.value}>
              {getMechanicName()}
            </Text>

            {mechanic?.email && (
              <>
                <Text style={styles.label}>
                  Correo electrónico
                </Text>

                <Text style={styles.value}>
                  {mechanic.email}
                </Text>
              </>
            )}
          </View>

          {/* Información de la orden */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Información de la orden
            </Text>

            <Text style={styles.label}>
              Número de orden
            </Text>
            <Text style={styles.value}>
              {order.order_number}
            </Text>

            <Text style={styles.label}>Fecha de recepción</Text>
            <Text style={styles.value}>
              {order.received_at
                ? new Date(order.received_at).toLocaleString('es-GT')
                : 'No disponible'}
            </Text>

            <Text style={styles.label}>Prioridad</Text>
            <Text style={styles.value}>
              {priorities[order.priority]}
            </Text>

            <Text style={styles.label}>Estado actual</Text>
            <Text style={styles.value}>
              {statuses.find(
                item => item.value === order.status
              )?.label ?? order.status}
            </Text>
          </View>

          {/* Problema reportado */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Problema reportado
            </Text>

            <Text style={styles.value}>
              {order.reported_problem}
            </Text>
          </View>

          {/* Cambiar estado */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Cambiar estado
            </Text>

            <Text style={styles.info}>
              Selecciona el nuevo estado de la orden:
            </Text>

            <View style={styles.statusContainer}>
              {statuses.map(item => {
                const selected = order.status === item.value;

                return (
                  <Pressable
                    key={item.value}
                    disabled={saving || selected}
                    onPress={() =>
                      void handleUpdateStatus(item.value)
                    }
                    style={[
                      styles.statusButton,
                      selected && styles.statusSelected,
                      saving && styles.disabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        selected && styles.statusSelectedText,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {saving && (
              <View style={styles.savingContainer}>
                <ActivityIndicator color={colors.primary} />

                <Text style={styles.info}>
                  Actualizando estado...
                </Text>
              </View>
            )}
          </View>

          {/* Diagnóstico mecánico */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Diagnóstico mecánico
            </Text>

            <Text style={styles.info}>
              Registra el estado de los componentes y las
              observaciones realizadas durante la revisión.
            </Text>

            <PrimaryButton
              label="Realizar diagnóstico"
              onPress={() =>
                router.push(`/orders/${order.id}/diagnostic`)
              }
            />
          </View>
          <View style={styles.card}>
  <Text style={styles.sectionTitle}>
    Evidencias fotográficas
  </Text>

  <Text style={styles.info}>
    Agrega fotografías del antes y después
    de la reparación del vehículo.
  </Text>

  <PrimaryButton
    label="Ver evidencias"
    onPress={() =>
      router.push(`/orders/${order.id}/evidence`)
    }
  />
</View>

          <PrimaryButton
            label="Volver a órdenes"
            onPress={() => router.replace('/orders')}
          />
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },

  container: {
    paddingBottom: 50,
    gap: spacing.md,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },

  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: spacing.sm,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: spacing.sm,
  },

  value: {
    fontSize: 17,
    color: '#000',
  },

  info: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },

  error: {
    color: '#C62828',
    fontSize: 16,
  },

  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  statusButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },

  statusSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },

  statusSelectedText: {
    color: '#FFFFFF',
  },

  disabled: {
    opacity: 0.6,
  },

  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 12,
  },

  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF3',
    borderColor: '#ABEFC6',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },

  toastError: {
    backgroundColor: '#FEF3F2',
    borderColor: '#FECDCA',
  },

  toastIcon: {
    fontSize: 24,
    fontWeight: '700',
    color: '#079455',
  },

  toastIconError: {
    color: '#D92D20',
  },

  toastContent: {
    flex: 1,
    gap: 3,
  },

  toastTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#101828',
  },

  toastMessage: {
    fontSize: 14,
    color: '#475467',
  },

  toastClose: {
    fontSize: 18,
    color: '#667085',
    paddingHorizontal: 4,
  },
});
