import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Card } from '@/components/ui/Card';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

import { useAuth } from '@/features/auth/hooks/useAuth';

import {
  colors,
  spacing,
  typography,
} from '@/theme';

import {
  getFriendlyErrorMessage,
} from '@/utils/errors';

export default function MoreScreen() {
  const {
    signOut,
    profile,
  } = useAuth();

  const [
    confirmVisible,
    setConfirmVisible,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const handleSignOut = async () => {
    setLoading(true);
    setError(null);

    try {
      await signOut();

      setConfirmVisible(false);
    } catch (err) {
      setError(
        getFriendlyErrorMessage(
          err,
          'No se pudo cerrar sesión.',
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader
        title="Más"
        subtitle="Cuenta y configuración"
      />

      <Card style={styles.card}>
        {/* PERFIL */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir mi perfil"
          style={styles.row}
          onPress={() =>
            router.push('/profile')
          }
        >
          <Ionicons
            name="person-outline"
            size={22}
            color={colors.navy}
          />

          <Text style={styles.rowText}>
            Mi perfil
          </Text>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textMuted}
          />
        </Pressable>

        {/* SOLO ADMIN */}
        {profile?.role === 'ADMIN' ? (
          <>
            <View style={styles.divider} />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Administrar usuarios del taller"
              style={styles.row}
              onPress={() =>
                router.push('/users')
              }
            >
              <Ionicons
                name="people-outline"
                size={22}
                color={colors.navy}
              />

              <Text style={styles.rowText}>
                Usuarios del taller
              </Text>

              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
          </>
        ) : null}

        <View style={styles.divider} />

        {/* CERRAR SESIÓN */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
          style={styles.row}
          onPress={() =>
            setConfirmVisible(true)
          }
        >
          <Ionicons
            name="log-out-outline"
            size={22}
            color={colors.error}
          />

          <Text
            style={[
              styles.rowText,
              styles.danger,
            ]}
          >
            Cerrar sesión
          </Text>
        </Pressable>
      </Card>

      {error ? (
        <Text style={styles.error}>
          {error}
        </Text>
      ) : null}

      <ConfirmationModal
        visible={confirmVisible}
        title="Cerrar sesión"
        message="¿Seguro que deseas salir de TallerIQ?"
        confirmLabel="Cerrar sesión"
        cancelLabel="Cancelar"
        loading={loading}
        onCancel={() =>
          setConfirmVisible(false)
        }
        onConfirm={() => {
          void handleSignOut();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.sm,
  },

  row: {
    minHeight: 52,

    flexDirection: 'row',

    alignItems: 'center',

    gap: spacing.md,

    paddingVertical: spacing.sm,
  },

  rowText: {
    flex: 1,

    color: colors.textPrimary,

    fontSize: typography.size.md,

    fontWeight: '600',
  },

  danger: {
    color: colors.error,
  },

  divider: {
    height: 1,

    backgroundColor: colors.border,

    marginVertical: spacing.xs,
  },

  error: {
    marginTop: spacing.lg,

    color: colors.error,
  },
});