import { StyleSheet, Text, View } from 'react-native';

import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { colors, spacing, typography } from '@/theme';

type Props = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = 'Algo salió mal',
  message,
  onRetry,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <SecondaryButton label="Reintentar" onPress={onRetry} style={styles.button} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  title: {
    color: colors.error,
    fontSize: typography.size.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: colors.textSecondary,
    fontSize: typography.size.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    marginTop: spacing.sm,
    alignSelf: 'stretch',
  },
});
