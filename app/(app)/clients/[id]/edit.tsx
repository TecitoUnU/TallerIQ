import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import {
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
} from '@/components/ui';

import { ClientForm } from '@/features/auth/clients/components/client_formulario';
import { clientService } from '@/features/auth/clients/services/cliente_servicios';
import type {
  Client,
  ClientFormValues,
} from '@/features/auth/clients/types/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getFriendlyErrorMessage } from '@/utils/errors';

export default function EditClientScreen() {
  const { canManageClients } = useAuth();

  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [client, setClient] =
    useState<Client | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    const loadClient = async () => {
      if (!id) {
        setError(
          'No se encontró el identificador del cliente.',
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data =
          await clientService.getById(id);

        setClient(data);
      } catch (err) {
        setError(
          getFriendlyErrorMessage(
            err,
            'No se pudo cargar la información del cliente.',
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    void loadClient();
  }, [id]);

  if (!canManageClients) {
    return (
      <Screen>
        <ScreenHeader
          title="Editar cliente"
          onBack={() => router.back()}
        />

        <ErrorState
          message="Tu rol no tiene permiso para editar clientes."
        />
      </Screen>
    );
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error || !client) {
    return (
      <Screen>
        <ScreenHeader
          title="Editar cliente"
          onBack={() => router.back()}
        />

        <ErrorState
          message={
            error ??
            'No se encontró el cliente.'
          }
        />
      </Screen>
    );
  }

  const initialValues: ClientFormValues = {
    fullName: client.full_name,
    phone: client.phone,
    email: client.email ?? '',
    address: client.address ?? '',
    notes: client.notes ?? '',
  };

  const handleSubmit = async (
    values: ClientFormValues,
  ) => {
    try {
      setSaving(true);

      const updated =
        await clientService.update(
          client.id,
          values,
        );

      router.replace({
        pathname: '/clients/[id]',
        params: {
          id: updated.id,
        },
      });
    } catch (err) {
      Alert.alert(
        'No se pudo actualizar el cliente',
        getFriendlyErrorMessage(
          err,
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
        title="Editar cliente"
        subtitle="Actualiza los datos del propietario"
        onBack={() => router.back()}
      />

      <ClientForm
        initialValues={initialValues}
        submitLabel="Guardar cambios"
        loading={saving}
        onSubmit={handleSubmit}
      />
    </Screen>
  );
}