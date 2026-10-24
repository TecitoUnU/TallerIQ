import { supabase } from '@/lib/supabase/client';

export type DashboardNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  read_at: string | null;
  created_at: string;
};

export type DashboardReminder = {
  id: string;
  vehicle_id: string;
  service_name: string;
  last_service_mileage: number | null;
  next_service_mileage: number | null;
  status: string;
  plate: string;
  brand: string;
  model: string;
  current_mileage: number;
};

export type ServiceStatistic = {
  name: string;
  count: number;
  percentage: number;
  revenue: number;
  profit: number;
};

export type DashboardData = {
  receivedToday: number;
  inRepair: number;
  completed: number;
  waitingApproval: number;
  services: ServiceStatistic[];
  profitableServices: ServiceStatistic[];
  reminders: DashboardReminder[];
  notifications: DashboardNotification[];
};

type OrderRow = {
  id: string;
  status: string;
  received_at: string;
  vehicle_id: string;
};

type ReminderRow = {
  id: string;
  vehicle_id: string;
  service_name: string;
  last_service_mileage: number | null;
  next_service_mileage: number | null;
  status: string;
};

type VehicleRow = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  mileage: number;
};

type BudgetRow = {
  id: string;
  status: string;
};

type BudgetItemRow = {
  budget_id: string;
  description: string;
  item_type: string;
  subtotal: number;
  quantity: number;
  unit_cost: number;
};

function localDayStartIso(): string {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

export const dashboardService = {
  async getDashboard(userId: string): Promise<DashboardData> {
    const [ordersResult, remindersResult, notificationsResult, budgetsResult] =
      await Promise.all([
        supabase
          .from('work_orders')
          .select('id,status,received_at,vehicle_id'),
        supabase
          .from('maintenance_reminders')
          .select(
            'id,vehicle_id,service_name,last_service_mileage,next_service_mileage,status',
          )
          .in('status', ['PENDING', 'DUE', 'OVERDUE']),
        supabase
          .from('notifications')
          .select('id,title,body,type,entity_type,entity_id,read_at,created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.from('budgets').select('id,status'),
      ]);

    if (ordersResult.error) throw ordersResult.error;
    if (remindersResult.error) throw remindersResult.error;
    if (notificationsResult.error) throw notificationsResult.error;
    if (budgetsResult.error) throw budgetsResult.error;

    const orders = (ordersResult.data ?? []) as OrderRow[];
    const reminders = (remindersResult.data ?? []) as ReminderRow[];
    const notifications = (notificationsResult.data ?? []) as DashboardNotification[];
    const budgets = (budgetsResult.data ?? []) as BudgetRow[];

    const startOfDay = new Date(localDayStartIso()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
    const receivedToday = new Set(
      orders
        .filter((order) => {
          const receivedAt = new Date(order.received_at).getTime();
          return receivedAt >= startOfDay && receivedAt < endOfDay;
        })
        .map((order) => order.vehicle_id),
    ).size;

    const inRepair = orders.filter((order) => order.status === 'IN_REPAIR').length;
    const completed = orders.filter((order) => order.status === 'COMPLETED').length;
    const waitingApproval = orders.filter(
      (order) => order.status === 'WAITING_APPROVAL',
    ).length;

    const approvedBudgetIds = budgets
      .filter((budget) => budget.status === 'APPROVED')
      .map((budget) => budget.id);

    let serviceItems: BudgetItemRow[] = [];
    if (approvedBudgetIds.length > 0) {
      const { data, error } = await supabase
        .from('budget_items')
        .select('budget_id,description,item_type,subtotal,quantity,unit_cost')
        .eq('item_type', 'LABOR')
        .in('budget_id', approvedBudgetIds);

      if (error) throw error;
      serviceItems = (data ?? []) as BudgetItemRow[];
    }

    const serviceMap = new Map<string, ServiceStatistic>();
    for (const item of serviceItems) {
      const normalizedName =
        (item.description ?? '').trim().replace(/\\s+/g, ' ') ||
        'Servicio sin nombre';
      const key = normalizedName.toLowerCase();
      const current = serviceMap.get(key) ?? {
        name: normalizedName,
        count: 0,
        percentage: 0,
        revenue: 0,
        profit: 0,
      };
      current.count += Number(item.quantity) || 0;
      current.revenue += Number(item.subtotal) || 0;
      current.profit +=
        (Number(item.subtotal) || 0) -
        (Number(item.unit_cost) || 0) * (Number(item.quantity) || 0);
      serviceMap.set(key, current);
    }

    const serviceTotals = [...serviceMap.values()];
    const totalCount = serviceTotals.reduce((sum, item) => sum + item.count, 0);
    for (const item of serviceTotals) {
      item.percentage = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
    }
    const services = [...serviceTotals]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    const profitableServices = [...serviceTotals]
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);

    const vehicleIds = [...new Set(reminders.map((reminder) => reminder.vehicle_id))];
    let vehicles: VehicleRow[] = [];
    if (vehicleIds.length > 0) {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id,plate,brand,model,mileage')
        .in('id', vehicleIds)
        .is('deleted_at', null);

      if (error) throw error;
      vehicles = (data ?? []) as VehicleRow[];
    }
    const vehicleMap = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));

    const seenReminders = new Set<string>();
    const dashboardReminders: DashboardReminder[] = reminders
      .flatMap((reminder) => {
        const vehicle = vehicleMap.get(reminder.vehicle_id);
        if (!vehicle) return [];
        const dedupeKey = `${reminder.vehicle_id}:${reminder.service_name}:${reminder.next_service_mileage ?? ''}`;
        if (seenReminders.has(dedupeKey)) return [];
        seenReminders.add(dedupeKey);
        const nextMileage = reminder.next_service_mileage;
        const mileage = Number(vehicle.mileage) || 0;
        const status = reminder.status;
        return [{
          ...reminder,
          status,
          plate: vehicle.plate,
          brand: vehicle.brand,
          model: vehicle.model,
          current_mileage: mileage,
        }];
      })
      .sort((a, b) => {
        const aOverdue = a.status === 'OVERDUE' || (a.next_service_mileage !== null && a.current_mileage >= a.next_service_mileage);
        const bOverdue = b.status === 'OVERDUE' || (b.next_service_mileage !== null && b.current_mileage >= b.next_service_mileage);
        return Number(bOverdue) - Number(aOverdue);
      });

    return {
      receivedToday,
      inRepair,
      completed,
      waitingApproval,
      services,
      profitableServices,
      reminders: dashboardReminders,
      notifications,
    };
  },

  async markNotificationRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) throw error;
  },
};
