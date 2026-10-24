import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

type Props = TextInputProps & {
  label: string;
  error?: string;
};

export function TextField({ label, error, secureTextEntry, style, ...rest }: Props) {
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error ? styles.inputError : null]}>
        <TextInput
          {...rest}
          secureTextEntry={secureTextEntry ? hidden : false}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, style]}
          accessibilityLabel={label}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setHidden((value) => !value)}
            hitSlop={8}
          >
            <Text style={styles.toggle}>{hidden ? 'Ver' : 'Ocultar'}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    color: colors.textPrimary,
    fontSize: typography.size.sm,
    fontWeight: '600',
  },
  inputRow: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.size.md,
    paddingVertical: spacing.md,
  },
  toggle: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: typography.size.sm,
  },
  error: {
    color: colors.error,
    fontSize: typography.size.xs,
  },
});
