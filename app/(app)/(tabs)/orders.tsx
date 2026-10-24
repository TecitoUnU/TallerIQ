import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  FlatList,
  Pressable,
  RefreshControl,
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

import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

import { orderService } from '@/features/auth/orders/services/orden_servicios';

import type { WorkOrder } from '@/features/auth/orders/services/types/order';

import {
  colors,
  spacing,
  typography,
} from '@/theme';


type OrderFilter =
  | 'all'
  | 'receivedToday'
  | 'inRepair'
  | 'completed'
  | 'waitingApproval';

const FILTER_OPTIONS: { key: OrderFilter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'receivedToday', label: 'Recibidas hoy' },
  { key: 'inRepair', label: 'En reparación' },
  { key: 'completed', label: 'Terminadas' },
  { key: 'waitingApproval', label: 'Esperando aprobación' },
];

const PARAM_TO_FILTER: Record<string, OrderFilter> = {
  receivedToday: 'receivedToday',
  inRepair: 'inRepair',
  completed: 'completed',
  waitingApproval: 'waitingApproval',
};

function startOfLocalDay(): number {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start.getTime();
}

function endOfLocalDay(): number {
  return startOfLocalDay() + 24 * 60 * 60 * 1000;
}

export default function OrdersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ filter?: string }>();

  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderFilter>('all');

  const loadOrders = useCallback(async () => {
    try {
      setError(null);
      const data = await orderService.list();
      setOrders(data);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar las órdenes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadOrders();
    }, [loadOrders]),
  );

  useEffect(() => {
    const incoming = params.filter;
    if (incoming && PARAM_TO_FILTER[incoming]) {
      setFilter(PARAM_TO_FILTER[incoming]);
    } else if (incoming === undefined) {
      setFilter('all');
    }
  }, [params.filter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadOrders();
    } finally {
      setRefreshing(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const start = startOfLocalDay();
    const end = endOfLocalDay();
    return orders.filter((order) => {
      switch (filter) {
        case 'receivedToday': {
          const receivedAt = new Date(order.received_at).getTime();
          return receivedAt >= start && receivedAt < end;
        }
        case 'inRepair':
          return order.status === 'IN_REPAIR';
        case 'completed':
          return order.status === 'COMPLETED';
        case 'waitingApproval':
          return order.status === 'WAITING_APPROVAL';
        default:
          return true;
      }
    });
  }, [orders, filter]);

  const receivedTodayVehicles = useMemo(() => {
    if (filter !== 'receivedToday') return 0;
    return new Set(filteredOrders.map((order) => order.vehicle_id)).size;
  }, [filteredOrders, filter]);

  const emptyMessage = useMemo(() => {
    switch (filter) {
      case 'receivedToday':
        return 'No hay órdenes recibidas hoy.';
      case 'inRepair':
        return 'No hay órdenes en reparación.';
      case 'completed':
        return 'No hay órdenes terminadas.';
      case 'waitingApproval':
        return 'No hay órdenes esperando aprobación.';
      default:
        return 'Aún no hay órdenes';
    }
  }, [filter]);

  const subtitle =
    filter === 'all'
      ? `${orders.length} registradas`
      : `${filteredOrders.length} de ${orders.length} órdenes`;

  return (
    <Screen padded={false} style={styles.screenContent}>
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Órdenes" subtitle={subtitle} />

        <View style={styles.buttonContainer}>
          <PrimaryButton
            label="Nueva orden"
            onPress={() => router.push('/orders/new')}
          />
        </View>

        <ScrollView
          horizontal
          style={styles.filterScroll}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTER_OPTIONS.map((option) => {
            const active = filter === option.key;
            return (
              <Pressable
                key={option.key}
                onPress={() => setFilter(option.key)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {filter === 'receivedToday' && filteredOrders.length > 0 ? (
          <Text style={styles.helperText}>
            {filteredOrders.length} órdenes · {receivedTodayVehicles} vehículos únicos
          </Text>
        ) : null}

        {loading ? (
          <View style={styles.center}>
            <Text style={styles.message}>Cargando órdenes...</Text>
          </View>
        ) : error ? (
          <ErrorState message={error} />
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            title={emptyMessage}
            description={
              filter === 'all'
                ? 'Crea la primera orden de trabajo para comenzar.'
                : 'Cambia de filtro para consultar otras órdenes.'
            }
            actionLabel={filter === 'all' ? 'Nueva orden' : 'Ver todas'}
            onAction={() =>
              filter === 'all'
                ? router.push('/orders/new')
                : setFilter('all')
            }
          />
        ) : (
          <View style={styles.list}>
            {filteredOrders.map((item) => (
              <OrderCard
                key={item.id}
                order={item}
                onPress={() => router.push(`/orders/${item.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

type OrderCardProps = {
  order: WorkOrder;
  onPress: () => void;
};

function OrderCard({ order, onPress }: OrderCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderNumber}>{order.order_number}</Text>
        <Text style={styles.status}>{getStatusText(order.status)}</Text>
      </View>

      <Text style={styles.problem}>{order.reported_problem}</Text>

      <Text style={styles.info}>Kilometraje: {order.current_mileage} km</Text>

      <Text style={styles.info}>
        Prioridad: {getPriorityText(order.priority)}
      </Text>

      <PrimaryButton label="Ver orden" onPress={onPress} />
    </View>
  );
}

function getStatusText(status: WorkOrder['status']) {
  const statuses = {
    RECEIVED: 'Recibido',
    DIAGNOSIS: 'En diagnóstico',
    WAITING_APPROVAL: 'Esperando aprobación',
    APPROVED: 'Aprobado',
    IN_REPAIR: 'En reparación',
    COMPLETED: 'Terminado',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
  };
  return statuses[status];
}

function getPriorityText(priority: WorkOrder['priority']) {
  const priorities = {
    LOW: 'Baja',
    MEDIUM: 'Media',
    HIGH: 'Alta',
    URGENT: 'Urgente',
  };
  return priorities[priority];
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  body: {
    paddingBottom: spacing.sm,
  },
  buttonContainer: {
    marginBottom: spacing.xs,
  },
  filterScroll: {
    height: 40,
  },
  filterRow: {
    gap: spacing.xs,
    paddingBottom: 0,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.white,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
    marginBottom: 0,
  },
  list: {
    paddingTop: 0,
    paddingBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  status: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  problem: {
    fontSize: 16,
    color: '#000',
    marginBottom: 8,
  },
  info: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    color: colors.textMuted,
    fontSize: 16,
  },
});