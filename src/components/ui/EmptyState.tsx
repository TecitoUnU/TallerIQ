import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, spacing, typography } from '@/theme';

type Props = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, description, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <PrimaryButton label={actionLabel} onPress={onAction} style={styles.button} />
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
    color: colors.textPrimary,
    fontSize: typography.size.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.size.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    marginTop: spacing.xs,
    alignSelf: 'center',
    minWidth: 100,
    paddingHorizontal: spacing.md,
  },
});
