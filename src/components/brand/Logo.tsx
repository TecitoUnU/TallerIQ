import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

type Props = {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
};

const SIZE_MAP = {
  sm: 40,
  md: 64,
  lg: 88,
} as const;

export function Logo({ variant = 'light', size = 'md', showWordmark = true }: Props) {
  const dim = SIZE_MAP[size];
  const isDark = variant === 'dark';
  const markBg = isDark ? colors.white : colors.navy;
  const markFg = isDark ? colors.navy : colors.white;
  const accent = isDark ? colors.lightBlue : colors.secondary;
  const wordColor = isDark ? colors.white : colors.navy;

  return (
    <View style={styles.container} accessibilityRole="image" accessibilityLabel="TallerIQ">
      <View style={[styles.mark, { width: dim, height: dim, backgroundColor: markBg }]}>
        <View style={[styles.ring, { borderColor: accent }]} />
        <Text style={[styles.tiq, { color: markFg, fontSize: dim * 0.28 }]}>TIQ</Text>
        <View style={[styles.wrench, { backgroundColor: accent }]} />
      </View>
      {showWordmark ? (
        <View>
          <Text style={[styles.wordmark, { color: wordColor }]}>TallerIQ</Text>
          <Text style={[styles.tagline, { color: isDark ? colors.lightBlue : colors.textSecondary }]}>
            Gestión inteligente
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
  },
  mark: {
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ring: {
    position: 'absolute',
    width: '72%',
    height: '72%',
    borderRadius: radius.full,
    borderWidth: 2,
    opacity: 0.55,
  },
  tiq: {
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  wrench: {
    position: 'absolute',
    bottom: 8,
    width: '42%',
    height: 3,
    borderRadius: radius.full,
  },
  wordmark: {
    fontSize: typography.size.xxl,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  tagline: {
    marginTop: 2,
    fontSize: typography.size.sm,
    textAlign: 'center',
  },
});
