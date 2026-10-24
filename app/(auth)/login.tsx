import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
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
import { loginSchema, type LoginFormValues } from '@/validations/auth';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await signIn(values.email, values.password);
    } catch (error) {
      setFormError(getFriendlyErrorMessage(error, 'No se pudo iniciar sesión.'));
    }
  });

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.hero}>
          <Logo size="lg" />
        </View>

        <Card style={styles.card}>
          <Text style={styles.title}>Iniciar sesión</Text>
          <Text style={styles.subtitle}>
            Administra tu taller con orden, claridad y control.
          </Text>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Correo electrónico"
                autoCapitalize="none"
                autoCorrect={false}
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
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Contraseña"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.password?.message}
              />
            )}
          />

          {formError ? <Text style={styles.error}>{formError}</Text> : null}

          <PrimaryButton
            label="Entrar"
            onPress={() => {
              void onSubmit();
            }}
            loading={isSubmitting}
            disabled={isSubmitting}
          />

          <Link href="/forgot-password" style={styles.link}>
            ¿Olvidaste tu contraseña?
          </Link>
        </Card>

        <Text style={styles.footer}>
          ¿No tienes cuenta?{' '}
          <Link href="/register" style={styles.linkInline}>
            Regístrate
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
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
  link: {
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'center',
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
