import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { clientService } from '@/features/auth/clients/services/cliente_servicios';
import type { Client } from '@/features/auth/clients/types/client';
import { colors, radius, spacing, typography } from '@/theme';

type Props = {
  value: string;
  onChange: (clientId: string) => void;
  error?: string;
};

export function ClientSelector({
  value,
  onChange,
  error,
}: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await clientService.list();
        setClients(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  const selectedClient = clients.find(
    (client) => client.id === value,
  );

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>
        Cliente
      </Text>

      <Pressable
        onPress={() => setVisible(true)}
        style={[
          styles.selector,
          error ? styles.selectorError : null,
        ]}
      >
        <Text
          style={[
            styles.selectorText,
            !selectedClient ? styles.placeholder : null,
          ]}
        >
          {loading
            ? 'Cargando clientes...'
            : selectedClient
              ? selectedClient.full_name
              : 'Selecciona un cliente'}
        </Text>

        <Text style={styles.arrow}>
          ▼
        </Text>
      </Pressable>

      {error ? (
        <Text style={styles.error}>
          {error}
        </Text>
      ) : null}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Seleccionar cliente
              </Text>

              <Pressable
                onPress={() => setVisible(false)}
              >
                <Text style={styles.close}>
                  Cerrar
                </Text>
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
            >
              {clients.length === 0 ? (
                <Text style={styles.empty}>
                  No hay clientes registrados.
                </Text>
              ) : (
                clients.map((client) => (
                  <Pressable
                    key={client.id}
                    onPress={() => {
                      onChange(client.id);
                      setVisible(false);
                    }}
                    style={[
                      styles.client,
                      client.id === value
                        ? styles.selectedClient
                        : null,
                    ]}
                  >
                    <Text style={styles.clientName}>
                      {client.full_name}
                    </Text>

                    <Text style={styles.clientPhone}>
                      {client.phone}
                    </Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },

  label: {
    color: colors.textPrimary,
    fontSize: typography.size.sm,
    fontWeight: '600',
  },

  selector: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectorError: {
    borderColor: colors.error,
  },

  selectorText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.size.md,
  },

  placeholder: {
    color: colors.textMuted,
  },

  arrow: {
    color: colors.textMuted,
    fontSize: typography.size.sm,
  },

  error: {
    color: colors.error,
    fontSize: typography.size.xs,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    padding: spacing.xl,
  },

  modal: {
    maxHeight: '80%',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },

  modalTitle: {
    color: colors.textPrimary,
    fontSize: typography.size.lg,
    fontWeight: '700',
  },

  close: {
    color: colors.primary,
    fontSize: typography.size.sm,
    fontWeight: '700',
  },

  client: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },

  selectedClient: {
    backgroundColor: colors.background,
  },

  clientName: {
    color: colors.textPrimary,
    fontSize: typography.size.md,
    fontWeight: '600',
  },

  clientPhone: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
  },

  empty: {
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});