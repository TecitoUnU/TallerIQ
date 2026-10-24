
import { supabase } from '@/lib/supabase/client';

export type Mechanic = {
  id: string;
  full_name: string;
  email: string | null;
  role: 'MECANICO';
  workshop_id: string | null;
};

export const mechanicService = {
  async list(): Promise<Mechanic[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, workshop_id')
      .eq('role', 'MECANICO')
      .order('full_name', { ascending: true });

    if (error) throw error;

    return (data ?? []) as Mechanic[];
  },

  async getById(id: string): Promise<Mechanic | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, workshop_id')
      .eq('id', id)
      .eq('role', 'MECANICO')
      .maybeSingle();

    if (error) throw error;

    return data as Mechanic | null;
  },
};
