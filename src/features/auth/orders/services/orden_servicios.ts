import { supabase } from '@/lib/supabase/client';

import type {
  CreateWorkOrder,
  WorkOrder,
} from './types/order';

export const orderService = {
  async getOrderDetails(id: string) {
    const { data, error } = await supabase
      .from('work_orders')
      .select(`
        *,
        vehicles (
          id,
          plate,
          brand,
          model,
          year,
          color,
          mileage
        ),
        clients (
          id,
          full_name,
          phone,
          email,
          address
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async list(): Promise<WorkOrder[]> {
    const { data, error } = await supabase
      .from('work_orders')
      .select('*')
      .order('created_at', {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return data ?? [];
  },

  async getById(id: string): Promise<WorkOrder> {
    const { data, error } = await supabase
      .from('work_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async create(
    order: CreateWorkOrder,
  ): Promise<void> {
    const orderNumber =
      `OT-${Date.now()}`;

    const { error } = await supabase
      .from('work_orders')
      .insert({
        order_number: orderNumber,
        vehicle_id: order.vehicle_id,
        client_id: order.client_id,
        reported_problem: order.reported_problem,
        current_mileage: order.current_mileage,
        priority: order.priority,
        assigned_mechanic_id:
          order.assigned_mechanic_id,
        status: 'RECEIVED',
      });

    if (error) {
      console.error(
        'WORK ORDER CREATE ERROR:',
        error,
      );

      throw error;
    }
  },

  async updateStatus(
    id: string,
    status: WorkOrder['status'],
  ) {
    const { data, error } = await supabase
      .from('work_orders')
      .update({
        status,
        updated_at:
          new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },
};