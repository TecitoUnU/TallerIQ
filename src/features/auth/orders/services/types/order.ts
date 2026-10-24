export type WorkOrderStatus =
  | 'RECEIVED'
  | 'DIAGNOSIS'
  | 'WAITING_APPROVAL'
  | 'APPROVED'
  | 'IN_REPAIR'
  | 'COMPLETED'
  | 'DELIVERED'
  | 'CANCELLED';

export type WorkOrderPriority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'URGENT';

export type WorkOrder = {
  id: string;
  order_number: string;
  vehicle_id: string;
  client_id: string;
  assigned_mechanic_id: string | null;
  reported_problem: string;
  current_mileage: number;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  estimated_delivery_date: string | null;
  received_at: string;
  completed_at: string | null;
  delivered_at: string | null;
  internal_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  
};

export type CreateWorkOrder = {
  vehicle_id: string;
  client_id: string;
  assigned_mechanic_id: string;
  reported_problem: string;
  current_mileage: number;
  priority: WorkOrderPriority;
};