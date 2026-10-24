import {
  Ionicons,
} from '@expo/vector-icons';

import {
  router,
  useFocusEffect,
} from 'expo-router';

import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import {
  EmptyState,
  ErrorState,
  LoadingState,
  PrimaryButton,
  Screen,
  ScreenHeader,
} from '@/components/ui';

import {
  ClientCard,
} from '@/features/auth/clients/components/client_card';

import {
  clientService,
} from '@/features/auth/clients/services/cliente_servicios';

import type {
  Client,
} from '@/features/auth/clients/types/client';

import {
  useAuth,
} from '@/features/auth/hooks/useAuth';

import {
  colors,
  radius,
  spacing,
  typography,
} from '@/theme';

import {
  getFriendlyErrorMessage,
} from '@/utils/errors';

export default function ClientsScreen() {
  const {
    canManageClients,
  } =
    useAuth();

  const [
    clients,
    setClients,
  ] =
    useState<Client[]>([]);

  const [
    search,
    setSearch,
  ] =
    useState('');

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const loadClients =
    useCallback(
      async (
        isRefresh =
          false,
      ) => {
        try {
          if (
            isRefresh
          ) {
            setRefreshing(
              true,
            );
          } else {
            setLoading(
              true,
            );
          }

          setError(null);

          const data =
            await clientService
              .list();

          setClients(
            data,
          );
        } catch (
          err
        ) {
          setError(
            getFriendlyErrorMessage(
              err,
              'No se pudieron cargar los clientes.',
            ),
          );
        } finally {
          setLoading(
            false,
          );

          setRefreshing(
            false,
          );
        }
      },
      [],
    );

  useFocusEffect(
    useCallback(
      () => {
        void loadClients();
      },
      [loadClients],
    ),
  );

  const filteredClients =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLocaleLowerCase(
            'es-GT',
          );

      if (!term) {
        return clients;
      }

      return clients.filter(
        (client) => {
          const name =
            client.full_name
              .toLocaleLowerCase(
                'es-GT',
              );

          const phone =
            client.phone
              .toLocaleLowerCase(
                'es-GT',
              );

          const email =
            client.email
              ?.toLocaleLowerCase(
                'es-GT',
              ) ?? '';

          return (
            name.includes(
              term,
            ) ||
            phone.includes(
              term,
            ) ||
            email.includes(
              term,
            )
          );
        },
      );
    }, [
      clients,
      search,
    ]);

  if (loading) {
    return (
      <Screen>
        <ScreenHeader
          title="Clientes"
          subtitle="Directorio del taller"
        />

        <LoadingState
          message="Cargando clientes…"
        />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ScreenHeader
          title="Clientes"
          subtitle="Directorio del taller"
        />

        <ErrorState
          message={error}
          onRetry={() =>
            void loadClients()
          }
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title="Clientes"
        subtitle={
          `${clients.length} registrados`
        }
      />

      <View
        style={
          styles.toolbar
        }
      >
        <View
          style={
            styles.searchBox
          }
        >
          <Ionicons
            name="search-outline"
            size={20}
            color={
              colors.textMuted
            }
          />

          <TextInput
            value={search}
            onChangeText={
              setSearch
            }
            placeholder="Buscar por nombre, teléfono o correo"
            placeholderTextColor={
              colors.textMuted
            }
            autoCapitalize="none"
            style={
              styles.searchInput
            }
          />

          {search ? (
            <Ionicons
              name="close-circle"
              size={20}
              color={
                colors.textMuted
              }
              onPress={() =>
                setSearch('')
              }
            />
          ) : null}
        </View>

        {canManageClients ? (
          <PrimaryButton
            label="Nuevo cliente"
            onPress={() =>
              router.push(
                '/clients/new',
              )
            }
          />
        ) : null}
      </View>

      {clients.length ===
      0 ? (
        <EmptyState
          title="Aún no hay clientes"
          description="Registra el primer cliente del taller para comenzar a asociar vehículos y órdenes de trabajo."
          actionLabel={
            canManageClients
              ? 'Registrar cliente'
              : undefined
          }
          onAction={
            canManageClients
              ? () =>
                  router.push(
                    '/clients/new',
                  )
              : undefined
          }
        />
      ) : filteredClients.length ===
        0 ? (
        <EmptyState
          title="Sin resultados"
          description="No encontramos clientes que coincidan con tu búsqueda."
        />
      ) : (
        <FlatList
          data={
            filteredClients
          }
          keyExtractor={(
            item,
          ) => item.id}
          renderItem={({
            item,
          }) => (
            <ClientCard
              client={item}
              onPress={() =>
                router.push({
                  pathname:
                    '/clients/[id]',

                  params: {
                    id:
                      item.id,
                  },
                })
              }
            />
          )}
          contentContainerStyle={
            styles.list
          }
          ItemSeparatorComponent={() => (
            <View
              style={
                styles.separator
              }
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={
                refreshing
              }
              onRefresh={() =>
                void loadClients(
                  true,
                )
              }
              tintColor={
                colors.primary
              }
            />
          }
        />
      )}
    </Screen>
  );
}

const styles =
  StyleSheet.create({
    toolbar: {
      gap: spacing.md,

      marginBottom:
        spacing.lg,
    },

    searchBox: {
      minHeight: 50,

      borderWidth: 1,

      borderColor:
        colors.border,

      borderRadius:
        radius.md,

      backgroundColor:
        colors.white,

      paddingHorizontal:
        spacing.lg,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: spacing.sm,
    },

    searchInput: {
      flex: 1,

      color:
        colors.textPrimary,

      fontSize:
        typography.size.md,
    },

    list: {
      paddingBottom:
        spacing.xxxl,
    },

    separator: {
      height:
        spacing.md,
    },
  });