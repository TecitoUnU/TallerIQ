export type UserRole = 'ADMIN' | 'RECEPCIONISTA' | 'MECANICO';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  RECEPCIONISTA: 'Recepcionista',
  MECANICO: 'Mecánico',
};
