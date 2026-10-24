import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  ErrorState,
  LoadingState,
  PrimaryButton,
  Screen,
  ScreenHeader,
} from '@/components/ui';

import { useAuth } from '@/features/auth/hooks/useAuth';

import { UserCard } from '@/features/users/components/UserCard';

import { userService } from '@/features/users/services/userService';

import type {
  AppRole,
  UserProfile,
} from '@/features/users/types/user';

import {
  colors,
  radius,
  spacing,
} from '@/theme';

const roles: Array<{
  value: AppRole;
  label: string;
  description: string;
}> = [
  {
    value: 'ADMIN',
    label: 'Administrador',
    description:
      'Acceso completo al sistema y administración de usuarios.',
  },
  {
    value: 'RECEPCIONISTA',
    label: 'Recepcionista',
    description:
      'Puede administrar clientes, vehículos y órdenes.',
  },
  {
    value: 'MECANICO',
    label: 'Mecánico',
    description:
      'Puede trabajar con órdenes, diagnósticos y reparaciones.',
  },
];

export default function UsersScreen() {
  const { profile } = useAuth();

  const [users, setUsers] =
    useState<UserProfile[]>([]);

  const [
    selectedUser,
    setSelectedUser,
  ] =
    useState<UserProfile | null>(
      null,
    );

  const [
    selectedRole,
    setSelectedRole,
  ] =
    useState<AppRole | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [
    savingRole,
    setSavingRole,
  ] =
    useState(false);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const loadUsers =
    useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        const data =
          await userService.listUsers();

        setUsers(data);
      } catch (err) {
        console.error(
          'Error cargando usuarios:',
          err,
        );

        setError(
          'No se pudieron cargar los usuarios.',
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const openRoleModal = (
    user: UserProfile,
  ) => {
    if (user.id === profile?.id) {
      Alert.alert(
        'Tu cuenta',
        'Por seguridad no puedes modificar tu propio rol.',
      );

      return;
    }

    setSelectedUser(user);

    setSelectedRole(
      user.role as AppRole,
    );
  };

  const closeRoleModal = () => {
    if (savingRole) {
      return;
    }

    setSelectedUser(null);
    setSelectedRole(null);
  };

  const handleSaveRole =
    async () => {
      if (
        !selectedUser ||
        !selectedRole
      ) {
        return;
      }

      if (
        selectedRole ===
        selectedUser.role
      ) {
        Alert.alert(
          'Sin cambios',
          'El usuario ya tiene ese rol.',
        );

        return;
      }

      try {
        setSavingRole(true);

        console.log(
          'Cambiando rol:',
          {
            userId:
              selectedUser.id,

            oldRole:
              selectedUser.role,

            newRole:
              selectedRole,
          },
        );

        await userService.changeRole(
          selectedUser.id,
          selectedRole,
        );

        await loadUsers();

        setSelectedUser(null);
        setSelectedRole(null);

        Alert.alert(
          'Rol actualizado',
          'El rol del usuario fue actualizado correctamente.',
        );
      } catch (err) {
        console.error(
          'Error cambiando rol:',
          err,
        );

        let message =
          'No fue posible cambiar el rol.';

        if (
          err &&
          typeof err === 'object' &&
          'message' in err
        ) {
          message = String(
            err.message,
          );
        }

        Alert.alert(
          'No se pudo cambiar el rol',
          message,
        );
      } finally {
        setSavingRole(false);
      }
    };

  if (
    profile?.role !== 'ADMIN'
  ) {
    return (
      <Screen>
        <ScreenHeader
          title="Usuarios"
          onBack={() =>
            router.back()
          }
        />

        <ErrorState
          message="Solo los administradores pueden administrar usuarios."
        />
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen>
        <ScreenHeader
          title="Usuarios"
          onBack={() =>
            router.back()
          }
        />

        <LoadingState
          message="Cargando usuarios..."
        />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ScreenHeader
          title="Usuarios"
          onBack={() =>
            router.back()
          }
        />

        <ErrorState
          message={error}
          onRetry={() =>
            void loadUsers()
          }
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <ScreenHeader
        title="Usuarios"
        subtitle="Personal del taller"
        onBack={() =>
          router.back()
        }
      />

      <View style={styles.list}>
        {users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            onPress={() =>
              openRoleModal(user)
            }
          />
        ))}
      </View>

      <Modal
        visible={
          selectedUser !== null
        }
        transparent
        animationType="fade"
        onRequestClose={
          closeRoleModal
        }
      >
        <View
          style={styles.overlay}
        >
          <View
            style={styles.modal}
          >
            <Text
              style={
                styles.modalTitle
              }
            >
              Cambiar rol
            </Text>

            <Text
              style={
                styles.modalSubtitle
              }
            >
              {selectedUser
                ?.full_name ||
                'Usuario TallerIQ'}
            </Text>

            <View
              style={
                styles.rolesContainer
              }
            >
              {roles.map(
                (role) => {
                  const isSelected =
                    selectedRole ===
                    role.value;

                  return (
                    <Pressable
                      key={
                        role.value
                      }
                      disabled={
                        savingRole
                      }
                      onPress={() =>
                        setSelectedRole(
                          role.value,
                        )
                      }
                      style={[
                        styles.roleButton,

                        isSelected &&
                          styles.roleButtonSelected,
                      ]}
                    >
                      <View
                        style={
                          styles.roleContent
                        }
                      >
                        <View
                          style={
                            styles.roleTextContainer
                          }
                        >
                          <Text
                            style={[
                              styles.roleTitle,

                              isSelected &&
                                styles.roleTitleSelected,
                            ]}
                          >
                            {
                              role.label
                            }
                          </Text>

                          <Text
                            style={
                              styles.roleDescription
                            }
                          >
                            {
                              role.description
                            }
                          </Text>
                        </View>

                        <Ionicons
                          name={
                            isSelected
                              ? 'radio-button-on'
                              : 'radio-button-off'
                          }
                          size={24}
                          color={
                            isSelected
                              ? colors.primary
                              : colors.textMuted
                          }
                        />
                      </View>
                    </Pressable>
                  );
                },
              )}
            </View>

            <PrimaryButton
              label={
                savingRole
                  ? 'Guardando...'
                  : 'Guardar cambios'
              }
              disabled={
                savingRole ||
                !selectedRole ||
                selectedRole ===
                  selectedUser?.role
              }
              onPress={() => {
                void handleSaveRole();
              }}
            />

            <Pressable
              disabled={
                savingRole
              }
              style={
                styles.cancel
              }
              onPress={
                closeRoleModal
              }
            >
              <Text
                style={
                  styles.cancelText
                }
              >
                Cancelar
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles =
  StyleSheet.create({
    list: {
      gap: spacing.md,
    },

    overlay: {
      flex: 1,

      backgroundColor:
        'rgba(0,0,0,0.45)',

      justifyContent:
        'center',

      padding: spacing.lg,
    },

    modal: {
      backgroundColor:
        colors.white,

      padding: spacing.xl,

      borderRadius:
        radius.lg,

      maxWidth: 560,

      width: '100%',

      alignSelf: 'center',
    },

    modalTitle: {
      fontSize: 24,

      fontWeight: '800',

      color: colors.navy,
    },

    modalSubtitle: {
      marginTop: spacing.xs,

      marginBottom:
        spacing.lg,

      color:
        colors.textMuted,

      fontSize: 16,
    },

    rolesContainer: {
      gap: spacing.sm,

      marginBottom:
        spacing.lg,
    },

    roleButton: {
      padding: spacing.lg,

      borderWidth: 1,

      borderColor:
        colors.border,

      borderRadius:
        radius.md,

      backgroundColor:
        colors.white,
    },

    roleButtonSelected: {
      borderColor:
        colors.primary,

      backgroundColor:
        colors.lightBlue,
    },

    roleContent: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: spacing.md,
    },

    roleTextContainer: {
      flex: 1,
    },

    roleTitle: {
      fontSize: 16,

      fontWeight: '700',

      color: colors.navy,
    },

    roleTitleSelected: {
      color:
        colors.primary,
    },

    roleDescription: {
      marginTop:
        spacing.xs,

      color:
        colors.textMuted,

      lineHeight: 19,
    },

    cancel: {
      marginTop:
        spacing.md,

      alignItems:
        'center',

      padding: spacing.md,
    },

    cancelText: {
      color:
        colors.textMuted,

      fontWeight: '600',
    },
  });