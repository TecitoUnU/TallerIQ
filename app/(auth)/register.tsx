import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
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
import { registerSchema, type RegisterFormValues } from '@/validations/auth';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSuccessMessage(null);
    try {
      const result = await signUp({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        phone: values.phone,
      });

      if (result.needsEmailConfirmation) {
        setSuccessMessage(
          'Cuenta creada. Revisa tu correo para confirmarla antes de iniciar sesión.',
        );
        return;
      }

      router.replace('/home');
    } catch (error) {
      setFormError(getFriendlyErrorMessage(error, 'No se pudo crear la cuenta.'));
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
         

          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Nombre completo"
                autoComplete="name"
                textContentType="name"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.fullName?.message}
              />
            )}
          />

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

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Teléfono (opcional)"
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.phone?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Contraseña"
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Confirmar contraseña"
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.confirmPassword?.message}
              />
            )}
          />

          {formError ? <Text style={styles.error}>{formError}</Text> : null}
          {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}

          <PrimaryButton
            label="Registrarme"
            onPress={() => {
              void onSubmit();
            }}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </Card>

        <Text style={styles.footer}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" style={styles.linkInline}>
            Inicia sesión
          </Link>
        </Text>
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
    paddingTop: spacing.md,
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
    fontSize: typography.size.sm,
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
  footer: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  linkInline: {
    color: colors.primary,
    fontWeight: '700',
  },
});
