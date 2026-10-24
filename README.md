# TallerIQ

Aplicación móvil para administrar talleres mecánicos (React Native + Expo + TypeScript + Supabase).

## Estado actual: Fase 1

Completado:

- Arquitectura modular
- Esquema PostgreSQL + RLS en Supabase
- Autenticación (login, registro, recuperación, sesión, perfil)
- Tema visual azul marino
- Navegación protegida con Expo Router

Pendiente (siguientes fases): clientes, vehículos, órdenes, diagnósticos, evidencias, presupuestos, IA, dashboard.

## Tecnologías

- Expo SDK 57 + Expo Router
- React Native + TypeScript estricto
- Supabase (Auth, PostgreSQL, Storage, RLS)
- React Hook Form + Zod
- AsyncStorage para persistencia de sesión

## Instalación

```bash
npm install --legacy-peer-deps
cp .env.example .env
```

Completa `.env` con la URL y anon key de tu proyecto Supabase.

## Variables de entorno

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Nunca coloques `service_role` ni API keys de IA en el cliente.

## Ejecutar

```bash
npm run start
```

Luego abre Expo Go (Android/iOS) o un emulador.

Verificación TypeScript:

```bash
npm run typecheck
```

## Configuración Supabase

Proyecto actual: `proyecto_progra` (`pqhbedzrnndrolotmuvu`).

Migraciones en `supabase/migrations/`:

1. `20260916120000_initial_schema.sql` — enums, tablas, triggers, índices
2. `20260916120100_rls_and_storage.sql` — RLS + bucket privado `evidence`

### Crear usuario inicial

1. Regístrate desde la app.
2. En SQL Editor de Supabase, promueve al ADMIN:

```sql
UPDATE public.profiles
SET role = 'ADMIN'
WHERE email = 'tu-correo@ejemplo.com';
```

### Confirmación de correo

Si el registro pide confirmar email, desactiva la confirmación en Auth → Providers → Email (solo desarrollo) o confirma desde el correo.

## Roles

| Rol | Acceso |
|---|---|
| ADMIN | Completo |
| RECEPCIONISTA | Clientes, vehículos, órdenes, presupuestos |
| MECANICO | Órdenes asignadas, diagnósticos, evidencias |

Los roles viven en `profiles.role` (no en `user_metadata`).

## Estructura

```
app/                 # Rutas Expo Router
src/
  components/        # UI y marca
  features/auth/     # Auth (servicios + hooks)
  lib/supabase/      # Cliente Supabase
  theme/             # Tokens visuales
  types/             # Tipos TS
  utils/             # Errores, formato, strings
  validations/       # Schemas Zod
supabase/migrations/ # SQL versionado
docs/                # Arquitectura
```

## Flujo de autenticación

Usuario no autenticado → pantallas `(auth)`  
Usuario autenticado → tabs `(app)`  
La sesión se restaura automáticamente al abrir la app.

## Capturas

Pendientes (se agregarán al avanzar UI de negocio).
