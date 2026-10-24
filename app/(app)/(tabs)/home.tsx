import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Logo } from '@/components/brand/Logo';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  dashboardService,
  type DashboardData,
  type DashboardNotification,
} from '@/features/dashboard/services/dashboardService';
import { colors, spacing, typography } from '@/theme';
import { getGreeting } from '@/utils/format';
import { getFirstName } from '@/utils/string';

const EMPTY_DASHBOARD: DashboardData = {
  receivedToday: 0,
  inRepair: 0,
  completed: 0,
  waitingApproval: 0,
  services: [],
  profitableServices: [],
  reminders: [],
  notifications: [],
};

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const firstName = profile ? getFirstName(profile.full_name) : 'equipo';

  const loadDashboard = useCallback(async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const result = await dashboardService.getDashboard(profile.id);
      setDashboard(result);
    } catch (err) {
      console.error('DASHBOARD LOAD ERROR:', err);
      setError('No se pudo cargar el dashboard. Comprueba tu conexión e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

  const refresh = async () => {
    setRefreshing(true);
    try {
      await loadDashboard();
    } finally {
      setRefreshing(false);
    }
  };

  const markAsRead = async (notification: DashboardNotification) => {
    if (notification.read_at || markingId) return;
    try {
      setMarkingId(notification.id);
      await dashboardService.markNotificationRead(notification.id);
      setDashboard((current) => ({
        ...current,
        notifications: current.notifications.map((item) =>
          item.id === notification.id
            ? { ...item, read_at: new Date().toISOString() }
            : item,
        ),
      }));
    } catch (err) {
      console.error('NOTIFICATION READ ERROR:', err);
      setError('No se pudo actualizar la notificación.');
    } finally {
      setMarkingId(null);
    }
  };

  const stats = [
    {
      label: 'Vehículos recibidos hoy',
      value: dashboard.receivedToday,
      icon: 'car-outline' as const,
      color: colors.primary,
      background: colors.lightBlue,
      action: () => router.push({ pathname: '/orders', params: { filter: 'receivedToday' } }),
    },
    {
      label: 'En reparación',
      value: dashboard.inRepair,
      icon: 'construct-outline' as const,
      color: colors.warning,
      background: colors.warningSoft,
      action: () => router.push({ pathname: '/orders', params: { filter: 'inRepair' } }),
    },
    {
      label: 'Terminados',
      value: dashboard.completed,
      icon: 'checkmark-circle-outline' as const,
      color: colors.success,
      background: colors.successSoft,
      action: () => router.push({ pathname: '/orders', params: { filter: 'completed' } }),
    },
    {
      label: 'Esperando aprobación',
      value: dashboard.waitingApproval,
      icon: 'time-outline' as const,
      color: colors.error,
      background: colors.errorSoft,
      action: () => router.push({ pathname: '/orders', params: { filter: 'waitingApproval' } }),
    },
  ];

  const unreadCount = dashboard.notifications.filter((item) => !item.read_at).length;

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        <View style={styles.pagePadding}>
          <View style={styles.header}>
            <View style={styles.greetingBlock}>
              <Text style={styles.greeting}>{getGreeting()}, {firstName}</Text>
              <Text style={styles.headerSubtitle}>Resumen de tu taller</Text>
            </View>
            <Logo size="sm" showWordmark={false} />
          </View>

          <View style={styles.titleRow}>
            <View>
              <Text style={styles.brand}>TallerIQ</Text>
              <Text style={styles.caption}>Dashboard operativo</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Actualizar dashboard"
              onPress={() => void refresh()}
              style={styles.refreshButton}
            >
              <Ionicons name="refresh-outline" size={21} color={colors.primary} />
            </Pressable>
          </View>

          {error ? (
            <View style={styles.errorWrap}>
              <ErrorState message={error} />
              <PrimaryButton label="Reintentar" onPress={() => void refresh()} />
            </View>
          ) : null}

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Resumen de hoy</Text>
            <Text style={styles.sectionHint}>Datos de tus órdenes</Text>
          </View>

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.muted}>Cargando información...</Text>
            </View>
          ) : (
            <View style={styles.statsGrid}>
              {stats.map((item) => (
                <Pressable
                  key={item.label}
                  accessibilityRole="button"
                  onPress={item.action}
                  style={({ pressed }) => [
                    styles.statCard,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={[styles.statIcon, { backgroundColor: item.background }]}>
                    <Ionicons name={item.icon} size={21} color={item.color} />
                  </View>
                  <Text style={styles.statValue}>{item.value}</Text>
                  <Text style={styles.statLabel}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Servicios más realizados</Text>
            <Text style={styles.sectionHint}>Presupuestos aprobados</Text>
          </View>
          <Card style={styles.sectionCard}>
            {loading ? (
              <Text style={styles.muted}>Calculando estadísticas...</Text>
            ) : dashboard.services.length === 0 ? (
              <Text style={styles.muted}>
                Aún no hay servicios de mano de obra en presupuestos aprobados.
              </Text>
            ) : (
              dashboard.services.map((service) => (
                <View key={service.name} style={styles.chartRow}>
                  <View style={styles.chartLabelRow}>
                    <Text style={styles.chartLabel} numberOfLines={1}>{service.name}</Text>
                    <Text style={styles.chartPercent}>{Math.round(service.percentage)}%</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${Math.max(0, Math.min(100, service.percentage))}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.chartSubtext}>
                    {service.count.toLocaleString('es-GT')} unidades registradas
                  </Text>
                </View>
              ))
            )}
          </Card>

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Servicios más rentables</Text>
            <Text style={styles.sectionHint}>Estimación según presupuestos aprobados</Text>
          </View>
          <Card style={styles.sectionCard}>
            {loading ? (
              <Text style={styles.muted}>Calculando importes...</Text>
            ) : dashboard.profitableServices.length === 0 ? (
              <Text style={styles.muted}>No hay datos suficientes para calcular la rentabilidad.</Text>
            ) : (
              dashboard.profitableServices.map((service) => (
                <View key={service.name} style={styles.moneyRow}>
                  <View style={styles.moneyNameWrap}>
                    <Text style={styles.moneyName}>{service.name}</Text>
                    <Text style={styles.moneyCaption}>Ingreso: {formatQuetzales(service.revenue)}</Text>
                  </View>
                  <Text style={[
                    styles.moneyValue,
                    { color: service.profit >= 0 ? colors.success : colors.error },
                  ]}>
                    {formatQuetzales(service.profit)}
                  </Text>
                </View>
              ))
            )}
            <Text style={styles.disclaimer}>
              La utilidad estimada se calcula como subtotal menos costo unitario por cantidad. Verifica que los costos estén registrados correctamente.
            </Text>
          </Card>

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Recordatorios de mantenimiento</Text>
            <Text style={styles.sectionHint}>{dashboard.reminders.length} alertas</Text>
          </View>
          <Card style={styles.sectionCard}>
            {loading ? (
              <Text style={styles.muted}>Buscando recordatorios...</Text>
            ) : dashboard.reminders.length === 0 ? (
              <Text style={styles.muted}>
                No hay recordatorios próximos o vencidos. Registra los intervalos de mantenimiento para generar alertas.
              </Text>
            ) : (
              dashboard.reminders.map((reminder) => {
                const due = reminder.next_service_mileage !== null &&
                  reminder.current_mileage >= reminder.next_service_mileage;
                return (
                  <View key={reminder.id} style={styles.alertRow}>
                    <View style={[styles.alertIcon, { backgroundColor: due ? colors.errorSoft : colors.warningSoft }]}>
                      <Ionicons
                        name={due ? 'alert-circle-outline' : 'speedometer-outline'}
                        size={22}
                        color={due ? colors.error : colors.warning}
                      />
                    </View>
                    <View style={styles.alertTextWrap}>
                      <Text style={styles.alertTitle}>
                        {reminder.brand} {reminder.model} — {reminder.service_name}
                      </Text>
                      <Text style={styles.alertDescription}>
                        {due ? 'El mantenimiento está vencido.' : 'El vehículo podría estar próximo a su mantenimiento.'}
                      </Text>
                      <Text style={styles.chartSubtext}>
                        Placa {reminder.plate} · Actual {reminder.current_mileage.toLocaleString('es-GT')} km
                        {reminder.next_service_mileage !== null
                          ? ` · Objetivo ${reminder.next_service_mileage.toLocaleString('es-GT')} km`
                          : ''}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
            <PrimaryButton
              label="Ver vehículos"
              onPress={() => router.push('/vehicles')}
              style={styles.actionButton}
            />
          </Card>

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Notificaciones</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount} sin leer</Text>
            </View>
          </View>
          <Card style={styles.sectionCard}>
            {loading ? (
              <Text style={styles.muted}>Cargando notificaciones...</Text>
            ) : dashboard.notifications.length === 0 ? (
              <Text style={styles.muted}>
                No tienes notificaciones registradas. Los avisos guardados aparecerán aquí.
              </Text>
            ) : (
              dashboard.notifications.map((notification) => (
                <Pressable
                  key={notification.id}
                  accessibilityRole="button"
                  onPress={() => void markAsRead(notification)}
                  disabled={Boolean(notification.read_at) || Boolean(markingId)}
                  style={[
                    styles.notificationRow,
                    !notification.read_at && styles.notificationUnread,
                  ]}
                >
                  <View style={styles.notificationIcon}>
                    <Ionicons
                      name={notification.read_at ? 'notifications-outline' : 'notifications'}
                      size={20}
                      color={notification.read_at ? colors.textMuted : colors.primary}
                    />
                  </View>
                  <View style={styles.notificationBody}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={styles.notificationText}>{notification.body}</Text>
                    <Text style={styles.chartSubtext}>
                      {new Date(notification.created_at).toLocaleString('es-GT')}
                      {notification.read_at ? ' · Leída' : ' · Toca para marcar como leída'}
                    </Text>
                  </View>
                  {markingId === notification.id ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : null}
                </Pressable>
              ))
            )}
          </Card>
          <Text style={styles.footer}>TallerIQ · Información basada en los registros disponibles.</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

function formatQuetzales(value: number): string {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    maximumFractionDigits: 2,
  }).format(value);
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  pagePadding: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  greetingBlock: {
    flex: 1,
    paddingRight: spacing.md,
  },
  greeting: {
    color: colors.textSecondary,
    fontSize: typography.size.md,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: typography.size.sm,
    marginTop: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  brand: {
    color: colors.navy,
    fontSize: typography.size.hero,
    fontWeight: '800',
  },
  caption: {
    color: colors.textSecondary,
    fontSize: typography.size.md,
    marginTop: spacing.xs,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    flex: 1,
    color: colors.navy,
    fontSize: typography.size.lg,
    fontWeight: '800',
  },
  sectionHint: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
    textAlign: 'right',
    flexShrink: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    width: '47.5%',
    flexGrow: 1,
    minHeight: 142,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    color: colors.navy,
    fontSize: 28,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    marginTop: spacing.xs,
    lineHeight: 19,
  },
  sectionCard: {
    marginBottom: spacing.sm,
    padding: spacing.lg,
    gap: spacing.md,
  },
  chartRow: {
    marginBottom: spacing.md,
  },
  chartLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  chartLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.size.md,
    fontWeight: '600',
  },
  chartPercent: {
    color: colors.primary,
    fontSize: typography.size.md,
    fontWeight: '800',
  },
  barTrack: {
    height: 9,
    borderRadius: 6,
    backgroundColor: colors.lightBlue,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  chartSubtext: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
    marginTop: 5,
  },
  moneyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  moneyNameWrap: {
    flex: 1,
  },
  moneyName: {
    color: colors.textPrimary,
    fontSize: typography.size.md,
    fontWeight: '700',
  },
  moneyCaption: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
    marginTop: 3,
  },
  moneyValue: {
    fontSize: typography.size.md,
    fontWeight: '800',
    textAlign: 'right',
  },
  disclaimer: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
    lineHeight: 17,
    marginTop: spacing.sm,
  },
  alertRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTextWrap: {
    flex: 1,
  },
  alertTitle: {
    color: colors.textPrimary,
    fontSize: typography.size.md,
    fontWeight: '700',
  },
  alertDescription: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    lineHeight: 19,
    marginTop: 3,
  },
  actionButton: {
    marginTop: spacing.sm,
  },
  badge: {
    borderRadius: 99,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    backgroundColor: colors.lightBlue,
  },
  badgeText: {
    color: colors.primary,
    fontSize: typography.size.xs,
    fontWeight: '700',
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  notificationUnread: {
    backgroundColor: '#F7FAFF',
  },
  notificationIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBody: {
    flex: 1,
  },
  notificationTitle: {
    color: colors.textPrimary,
    fontSize: typography.size.md,
    fontWeight: '700',
  },
  notificationText: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    lineHeight: 20,
    marginTop: 3,
  },
  loading: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  muted: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
  errorWrap: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.75,
  },
  footer: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
