type ErrorLike = {
  message?: string;
  code?: string;
  status?: number;
  name?: string;
};

const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Correo o contraseña incorrectos.',
  email_not_confirmed: 'Debes confirmar tu correo antes de iniciar sesión.',
  user_already_registered: 'Ya existe una cuenta con este correo.',
  over_email_send_rate_limit: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  weak_password: 'La contraseña es demasiado débil.',
};

export function getFriendlyErrorMessage(error: unknown, fallback?: string): string {
  if (!error) {
    return fallback ?? 'Ocurrió un error inesperado. Inténtalo de nuevo.';
  }

  if (typeof error === 'string') {
    return mapRawMessage(error, fallback);
  }

  const err = error as ErrorLike;
  const code = err.code?.toLowerCase() ?? '';
  const message = err.message ?? '';

  if (code && AUTH_MESSAGES[code]) {
    return AUTH_MESSAGES[code];
  }

  if (/invalid login credentials/i.test(message)) {
    return AUTH_MESSAGES.invalid_credentials;
  }

  if (/email not confirmed/i.test(message)) {
    return AUTH_MESSAGES.email_not_confirmed;
  }

  if (/user already registered|already been registered/i.test(message)) {
    return AUTH_MESSAGES.user_already_registered;
  }

  if (/network request failed|failed to fetch|networkerror/i.test(message)) {
    return 'No hay conexión a internet. Revisa tu red e inténtalo de nuevo.';
  }

  if (/JWT|session|expired|refresh_token/i.test(message)) {
    return 'Tu sesión expiró. Inicia sesión nuevamente.';
  }

  if (/permission|row-level security|rls/i.test(message)) {
    return 'No tienes permiso para realizar esta acción.';
  }

  if (/23505|duplicate key/i.test(message)) {
    return 'Ya existe un registro con esos datos.';
  }

  if (/Postgrest|PGRST|postgres/i.test(message) || err.name === 'PostgrestError') {
    return fallback ?? 'No se pudo completar la operación. Inténtalo de nuevo.';
  }

  return mapRawMessage(message, fallback);
}

function mapRawMessage(message: string, fallback?: string): string {
  const trimmed = message.trim();
  if (!trimmed) {
    return fallback ?? 'Ocurrió un error inesperado. Inténtalo de nuevo.';
  }
  if (/Postgrest|PGRST|23505|duplicate key|violates/i.test(trimmed)) {
    return fallback ?? 'No se pudo completar la operación. Inténtalo de nuevo.';
  }
  return trimmed;
}
