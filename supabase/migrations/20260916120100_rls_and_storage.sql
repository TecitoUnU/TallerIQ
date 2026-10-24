-- TallerIQ — RLS, storage y políticas

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY profiles_select_authenticated
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY profiles_update_own_or_admin
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- clients
CREATE POLICY clients_select_staff
  ON public.clients FOR SELECT TO authenticated
  USING (public.is_staff() AND deleted_at IS NULL);

CREATE POLICY clients_insert_managers
  ON public.clients FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_clients());

CREATE POLICY clients_update_managers
  ON public.clients FOR UPDATE TO authenticated
  USING (public.can_manage_clients())
  WITH CHECK (public.can_manage_clients());

CREATE POLICY clients_delete_admin
  ON public.clients FOR DELETE TO authenticated
  USING (public.is_admin());

-- vehicles
CREATE POLICY vehicles_select_staff
  ON public.vehicles FOR SELECT TO authenticated
  USING (public.is_staff() AND deleted_at IS NULL);

CREATE POLICY vehicles_insert_managers
  ON public.vehicles FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_clients());

CREATE POLICY vehicles_update_managers
  ON public.vehicles FOR UPDATE TO authenticated
  USING (public.can_manage_clients())
  WITH CHECK (public.can_manage_clients());

CREATE POLICY vehicles_delete_admin
  ON public.vehicles FOR DELETE TO authenticated
  USING (public.is_admin());

-- work_orders
CREATE POLICY work_orders_select_staff
  ON public.work_orders FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR public.can_manage_clients()
    OR assigned_mechanic_id = auth.uid()
  );

CREATE POLICY work_orders_insert_managers
  ON public.work_orders FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_clients() OR public.is_admin());

CREATE POLICY work_orders_update_authorized
  ON public.work_orders FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR public.can_manage_clients()
    OR assigned_mechanic_id = auth.uid()
  )
  WITH CHECK (
    public.is_admin()
    OR public.can_manage_clients()
    OR assigned_mechanic_id = auth.uid()
  );

CREATE POLICY work_orders_delete_admin
  ON public.work_orders FOR DELETE TO authenticated
  USING (public.is_admin());

-- diagnostics
CREATE POLICY diagnostics_select_staff
  ON public.diagnostics FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.work_orders wo
      WHERE wo.id = work_order_id
        AND (
          public.is_admin()
          OR public.can_manage_clients()
          OR wo.assigned_mechanic_id = auth.uid()
        )
    )
  );

CREATE POLICY diagnostics_insert_authorized
  ON public.diagnostics FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.work_orders wo
      WHERE wo.id = work_order_id
        AND (
          public.is_admin()
          OR wo.assigned_mechanic_id = auth.uid()
          OR public.can_manage_clients()
        )
    )
  );

CREATE POLICY diagnostics_update_authorized
  ON public.diagnostics FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.work_orders wo
      WHERE wo.id = work_order_id
        AND (
          public.is_admin()
          OR wo.assigned_mechanic_id = auth.uid()
          OR public.can_manage_clients()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.work_orders wo
      WHERE wo.id = work_order_id
        AND (
          public.is_admin()
          OR wo.assigned_mechanic_id = auth.uid()
          OR public.can_manage_clients()
        )
    )
  );

-- diagnostic_items
CREATE POLICY diagnostic_items_select_staff
  ON public.diagnostic_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.diagnostics d
      JOIN public.work_orders wo ON wo.id = d.work_order_id
      WHERE d.id = diagnostic_id
        AND (
          public.is_admin()
          OR public.can_manage_clients()
          OR wo.assigned_mechanic_id = auth.uid()
        )
    )
  );

CREATE POLICY diagnostic_items_write_authorized
  ON public.diagnostic_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.diagnostics d
      JOIN public.work_orders wo ON wo.id = d.work_order_id
      WHERE d.id = diagnostic_id
        AND (
          public.is_admin()
          OR wo.assigned_mechanic_id = auth.uid()
          OR public.can_manage_clients()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.diagnostics d
      JOIN public.work_orders wo ON wo.id = d.work_order_id
      WHERE d.id = diagnostic_id
        AND (
          public.is_admin()
          OR wo.assigned_mechanic_id = auth.uid()
          OR public.can_manage_clients()
        )
    )
  );

-- evidence
CREATE POLICY evidence_select_staff
  ON public.evidence FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.work_orders wo
      WHERE wo.id = work_order_id
        AND (
          public.is_admin()
          OR public.can_manage_clients()
          OR wo.assigned_mechanic_id = auth.uid()
        )
    )
  );

CREATE POLICY evidence_insert_authorized
  ON public.evidence FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.work_orders wo
      WHERE wo.id = work_order_id
        AND (
          public.is_admin()
          OR wo.assigned_mechanic_id = auth.uid()
          OR public.can_manage_clients()
        )
    )
  );

CREATE POLICY evidence_delete_authorized
  ON public.evidence FOR DELETE TO authenticated
  USING (
    public.is_admin()
    OR created_by = auth.uid()
  );

-- services
CREATE POLICY services_select_staff
  ON public.services FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY services_write_admin
  ON public.services FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- budgets
CREATE POLICY budgets_select_staff
  ON public.budgets FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.work_orders wo
      WHERE wo.id = work_order_id
        AND (
          public.is_admin()
          OR public.can_manage_clients()
          OR wo.assigned_mechanic_id = auth.uid()
        )
    )
  );

CREATE POLICY budgets_write_managers
  ON public.budgets FOR ALL TO authenticated
  USING (public.can_manage_clients() OR public.is_admin())
  WITH CHECK (public.can_manage_clients() OR public.is_admin());

-- budget_items
CREATE POLICY budget_items_select_staff
  ON public.budget_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.budgets b
      JOIN public.work_orders wo ON wo.id = b.work_order_id
      WHERE b.id = budget_id
        AND (
          public.is_admin()
          OR public.can_manage_clients()
          OR wo.assigned_mechanic_id = auth.uid()
        )
    )
  );

CREATE POLICY budget_items_write_managers
  ON public.budget_items FOR ALL TO authenticated
  USING (public.can_manage_clients() OR public.is_admin())
  WITH CHECK (public.can_manage_clients() OR public.is_admin());

-- maintenance
CREATE POLICY maintenance_select_staff
  ON public.maintenance_reminders FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY maintenance_write_managers
  ON public.maintenance_reminders FOR ALL TO authenticated
  USING (public.can_manage_clients() OR public.is_admin())
  WITH CHECK (public.can_manage_clients() OR public.is_admin());

-- activity_logs
CREATE POLICY activity_logs_select_admin
  ON public.activity_logs FOR SELECT TO authenticated
  USING (public.is_admin() OR user_id = auth.uid());

CREATE POLICY activity_logs_insert_staff
  ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_staff() AND user_id = auth.uid());

-- notifications
CREATE POLICY notifications_select_own
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY notifications_update_own
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY notifications_insert_staff
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR user_id = auth.uid());

-- Storage bucket evidencias (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidence',
  'evidence',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY evidence_storage_select
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'evidence' AND public.is_staff());

CREATE POLICY evidence_storage_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evidence' AND public.is_staff());

CREATE POLICY evidence_storage_update
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'evidence' AND public.is_staff())
  WITH CHECK (bucket_id = 'evidence' AND public.is_staff());

CREATE POLICY evidence_storage_delete
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'evidence'
    AND (public.is_admin() OR owner = auth.uid())
  );
