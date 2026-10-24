import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Logo } from '@/components/brand/Logo';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { colors, spacing, typography } from '@/theme';
import { getFriendlyErrorMessage } from '@/utils/errors';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@/validations/auth';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSuccessMessage(null);
    try {
      const redirectTo = Linking.createURL('reset-password');
      await resetPassword(values.email, redirectTo);
      setSuccessMessage(
        'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.',
      );
    } catch (error) {
      setFormError(
        getFriendlyErrorMessage(error, 'No se pudo enviar el correo de recuperación.'),
      );
    }
  });

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.hero}>
          <Logo size="md" />
        </View>

        <Card style={styles.card}>
          <Text style={styles.title}>Recuperar contraseña</Text>
          <Text style={styles.subtitle}>
            Te enviaremos un enlace para restablecer el acceso a tu cuenta.
          </Text>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Correo electrónico"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.email?.message}
              />
            )}
          />

          {formError ? <Text style={styles.error}>{formError}</Text> : null}
          {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}

          <PrimaryButton
            label="Enviar enlace"
            onPress={() => {
              void onSubmit();
            }}
            loading={isSubmitting}
            disabled={isSubmitting}
          />

          <Link href="/login" style={styles.link}>
            Volver al inicio de sesión
          </Link>
        </Card>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    gap: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  card: {
    gap: spacing.lg,
  },
  title: {
    color: colors.navy,
    fontSize: typography.size.xl,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.size.md,
    marginTop: -spacing.sm,
  },
  error: {
    color: colors.error,
    fontSize: typography.size.sm,
  },
  success: {
    color: colors.success,
    fontSize: typography.size.sm,
  },
  link: {
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'center',
    fontSize: typography.size.sm,
  },
});
