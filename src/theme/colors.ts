export const colors = {
  navy: '#0B1F3A',
  primary: '#1565C0',
  secondary: '#3182CE',
  lightBlue: '#E8F1FB',
  white: '#FFFFFF',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  border: '#D9E2EC',
  textPrimary: '#102A43',
  textSecondary: '#486581',
  textMuted: '#829AB1',
  success: '#2F855A',
  successSoft: '#E6F6ED',
  warning: '#C05621',
  warningSoft: '#FFF4E6',
  error: '#C53030',
  errorSoft: '#FDECEC',
  overlay: 'rgba(11, 31, 58, 0.45)',
} as const;

export type ColorToken = keyof typeof colors;
