import {
  router,
} from 'expo-router';

import {
  useState,
} from 'react';

import {
  Alert,
} from 'react-native';

import {
  ErrorState,
  Screen,
  ScreenHeader,
} from '@/components/ui';

import {
  useAuth,
} from '@/features/auth/hooks/useAuth';

import {
  ClientForm,
} from '@/features/auth/clients/components/client_formulario';

import {
  clientService,
} from '@/features/auth/clients/services/cliente_servicios';

import type {
  ClientFormValues,
} from '@/features/auth/clients/types/client';

import {
  getFriendlyErrorMessage,
} from '@/utils/errors';

export default function NewClientScreen() {
  const {
    canManageClients,
  } =
    useAuth();

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  if (
    !canManageClients
  ) {
    return (
      <Screen>
        <ScreenHeader
          title="Nuevo cliente"
          onBack={() =>
            router.back()
          }
        />

        <ErrorState
          message="Tu rol no tiene permiso para registrar clientes."
        />
      </Screen>
    );
  }

  const handleSubmit =
    async (
      values:
        ClientFormValues,
    ) => {
      try {
        setSaving(true);

        const client =
          await clientService
            .create(
              values,
            );

        router.replace({
          pathname:
            '/clients/[id]',

          params: {
            id:
              client.id,
          },
        });
      } catch (
        error
      ) {
        Alert.alert(
          'No se pudo registrar el cliente',

          getFriendlyErrorMessage(
            error,
            'Revisa los datos e inténtalo nuevamente.',
          ),
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <Screen scroll>
      <ScreenHeader
        title="Nuevo cliente"
        subtitle="Datos del propietario"
        onBack={() =>
          router.back()
        }
      />

      <ClientForm
        submitLabel="Guardar cliente"
        loading={
          saving
        }
        onSubmit={
          handleSubmit
        }
      />
    </Screen>
  );
}