import { colors } from './colors';
import { shadows } from './shadows';
import { radius, spacing } from './spacing';
import { typography } from './typography';

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  shadows,
} as const;

export type Theme = typeof theme;

export { colors, radius, shadows, spacing, typography };
