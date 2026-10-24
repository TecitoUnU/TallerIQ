
export type DiagnosticItemStatus =
  | 'OK'
  | 'REVIEW'
  | 'REPLACE';

export type DiagnosticItem = {
  id: string;
  diagnostic_id: string;
  category: string;
  component: string;
  status: DiagnosticItemStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Diagnostic = {
  id: string;
  work_order_id: string;
  general_notes: string | null;
  ai_summary: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export const diagnosticChecklist = [
  {
    category: 'Frenos',
    component: 'Pastillas',
  },
  {
    category: 'Frenos',
    component: 'Discos',
  },
  {
    category: 'Frenos',
    component: 'Líquido',
  },
  {
    category: 'Suspensión',
    component: 'Amortiguadores',
  },
  {
    category: 'Suspensión',
    component: 'Rótulas',
  },
  {
    category: 'Suspensión',
    component: 'Bujes',
  },
  {
    category: 'Motor',
    component: 'Aceite',
  },
  {
    category: 'Motor',
    component: 'Filtros',
  },
  {
    category: 'Motor',
    component: 'Correas',
  },
] as const;