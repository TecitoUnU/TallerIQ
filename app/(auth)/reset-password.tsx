import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { z } from 'zod';

import { Logo } from '@/components/brand/Logo';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { supabase } from '@/lib/supabase/client';
import { colors, spacing, typography } from '@/theme';
import { getFriendlyErrorMessage } from '@/utils/errors';

const resetSchema = z
  .object({
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

type ResetValues = z.infer<typeof resetSchema>;

export default function ResetPasswordScreen() {
  const [ready, setReady] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    const establishSession = async (url: string | null) => {
      if (!url) return;
      const hash = url.split('#')[1] ?? '';
      const hashParams = new URLSearchParams(hash);
      const queryParams = new URLSearchParams(url.split('?')[1] ?? '');
      const accessToken =
        hashParams.get('access_token') ?? queryParams.get('access_token');
      const refreshToken =
        hashParams.get('refresh_token') ?? queryParams.get('refresh_token');
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!error) setReady(true);
      }
    };

    void Linking.getInitialURL().then(establishSession);
    const subscription = Linking.addEventListener('url', ({ url }) => {
      void establishSession(url);
    });

    const { data: authSubscription } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'PASSWORD_RECOVERY') setReady(true);
      },
    );

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => {
      subscription.remove();
      authSubscription.subscription.unsubscribe();
    };
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSuccessMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });
      if (error) throw error;
      await supabase.auth.signOut();
      setSuccessMessage('Tu contraseña se restableció correctamente. Inicia sesión.');
      setTimeout(() => router.replace('/login'), 1500);
    } catch (error) {
      setFormError(getFriendlyErrorMessage(error, 'No se pudo restablecer la contraseña.'));
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
          <Text style={styles.title}>Restablecer contraseña</Text>
          <Text style={styles.subtitle}>
            {ready
              ? 'Ingresa tu nueva contraseña.'
              : 'Abre el enlace enviado a tu correo para continuar.'}
          </Text>

          {formError ? <Text style={styles.error}>{formError}</Text> : null}
          {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}

          {ready ? (
            <>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextField
                    label="Nueva contraseña"
                    secureTextEntry
                    autoComplete="password"
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
                    autoComplete="password"
                    textContentType="newPassword"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={errors.confirmPassword?.message}
                  />
                )}
              />

              <PrimaryButton
                label="Guardar contraseña"
                onPress={() => {
                  void onSubmit();
                }}
                loading={isSubmitting}
                disabled={isSubmitting}
              />
            </>
          ) : null}

          <Link href="/login" style={styles.link}>
            Volver al inicio de sesión
          </Link>
        </Card>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: spacing.xl },
  hero: { alignItems: 'center', paddingTop: spacing.xl },
  card: { gap: spacing.lg },
  title: { color: colors.navy, fontSize: typography.size.xl, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: typography.size.md, marginTop: -spacing.sm },
  error: { color: colors.error, fontSize: typography.size.sm },
  success: { color: colors.success, fontSize: typography.size.sm },
  link: { color: colors.primary, fontWeight: '700', textAlign: 'center', fontSize: typography.size.sm },
});