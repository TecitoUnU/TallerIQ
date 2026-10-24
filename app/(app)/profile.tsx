import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { colors, spacing, typography } from '@/theme';
import { ROLE_LABELS } from '@/types/profile';
import { getFriendlyErrorMessage } from '@/utils/errors';
import {
  updateProfileSchema,
  type UpdateProfileFormValues,
} from '@/validations/auth';

export default function ProfileScreen() {
  const { profile, updateProfile } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
    },
  });

  useEffect(() => {
    reset({
      fullName: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
    });
  }, [profile, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSuccessMessage(null);
    try {
      await updateProfile({
        fullName: values.fullName,
        phone: values.phone,
      });
      setSuccessMessage('Perfil actualizado correctamente.');
    } catch (error) {
      setFormError(getFriendlyErrorMessage(error, 'No se pudo actualizar el perfil.'));
    }
  });

  return (
    <Screen scroll>
      <ScreenHeader
        title="Mi perfil"
        subtitle="Actualiza tu información"
        onBack={() => router.back()}
      />

      <Card style={styles.card}>
        <View style={styles.meta}>
          <Text style={styles.metaLabel}>Correo</Text>
          <Text style={styles.metaValue}>{profile?.email ?? '—'}</Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.metaLabel}>Rol</Text>
          <Text style={styles.metaValue}>
            {profile ? ROLE_LABELS[profile.role] : '—'}
          </Text>
        </View>

        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Nombre completo"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.fullName?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Teléfono"
              keyboardType="phone-pad"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.phone?.message}
            />
          )}
        />

        {formError ? <Text style={styles.error}>{formError}</Text> : null}
        {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}

        <PrimaryButton
          label="Guardar cambios"
          onPress={() => {
            void onSubmit();
          }}
          loading={isSubmitting}
          disabled={isSubmitting}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
  },
  meta: {
    gap: 2,
  },
  metaLabel: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metaValue: {
    color: colors.textPrimary,
    fontSize: typography.size.md,
    fontWeight: '600',
  },
  error: {
    color: colors.error,
    fontSize: typography.size.sm,
  },
  success: {
    color: colors.success,
    fontSize: typography.size.sm,
  },
});
