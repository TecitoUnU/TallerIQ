import { useCallback, useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

import { useAuth } from '@/features/auth/hooks/useAuth';

import { diagnosticService } from '@/features/auth/orders/services/diagnostico_servicios';

import type {
  Diagnostic,
  DiagnosticItem,
  DiagnosticItemStatus,
} from '@/features/auth/orders/services/types/diagnostic';

import { colors, spacing } from '@/theme';

const itemStatuses: {
  label: string;
  value: DiagnosticItemStatus;
}[] = [
  {
    label: 'Correcto',
    value: 'OK',
  },
  {
    label: 'Revisar',
    value: 'REVIEW',
  },
  {
    label: 'Reemplazar',
    value: 'REPLACE',
  },
];

type Toast = {
  type: 'success' | 'error';
  message: string;
};

export default function DiagnosticScreen() {
  const router = useRouter();

  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const {
    canManageDiagnostics,
  } = useAuth();

  const [
    diagnostic,
    setDiagnostic,
  ] = useState<Diagnostic | null>(
    null,
  );

  const [
    items,
    setItems,
  ] = useState<DiagnosticItem[]>([]);

  const [
    generalNotes,
    setGeneralNotes,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const [
    toast,
    setToast,
  ] = useState<Toast | null>(
    null,
  );

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer =
      setTimeout(() => {
        setToast(null);
      }, 3000);

    return () =>
      clearTimeout(timer);
  }, [toast]);

  const loadDiagnostic =
    useCallback(async () => {
      if (!canManageDiagnostics) {
        setError(
          'Tu usuario no tiene permiso para trabajar con diagnósticos.',
        );

        setLoading(false);

        return;
      }

      if (!id) {
        setError(
          'No se encontró la orden.',
        );

        setLoading(false);

        return;
      }

      try {
        setLoading(true);
        setError(null);

        const diagnosticData =
          await diagnosticService.getOrCreate(
            id,
          );

        const diagnosticItems =
          await diagnosticService.initializeChecklist(
            diagnosticData.id,
          );

        setDiagnostic(
          diagnosticData,
        );

        setItems(
          diagnosticItems,
        );

        setGeneralNotes(
          diagnosticData.general_notes ??
            '',
        );
      } catch (err) {
        console.error(
          'Error al cargar diagnóstico:',
          err,
        );

        setError(
          'No se pudo cargar el diagnóstico. Si eres mecánico, comprueba que esta orden esté asignada a tu usuario.',
        );
      } finally {
        setLoading(false);
      }
    }, [
      id,
      canManageDiagnostics,
    ]);

  useFocusEffect(
    useCallback(() => {
      void loadDiagnostic();
    }, [loadDiagnostic]),
  );

  const changeItemStatus = (
    itemId: string,
    status: DiagnosticItemStatus,
  ) => {
    setItems(previous =>
      previous.map(item =>
        item.id === itemId
          ? {
              ...item,
              status,
            }
          : item,
      ),
    );
  };

  const changeItemNotes = (
    itemId: string,
    notes: string,
  ) => {
    setItems(previous =>
      previous.map(item =>
        item.id === itemId
          ? {
              ...item,
              notes,
            }
          : item,
      ),
    );
  };

  const handleSave =
    async () => {
      if (
        !canManageDiagnostics
      ) {
        setToast({
          type: 'error',

          message:
            'No tienes permiso para guardar diagnósticos.',
        });

        return;
      }

      if (
        !diagnostic ||
        saving
      ) {
        return;
      }

      try {
        setSaving(true);

        setToast(null);

        await diagnosticService.updateGeneralNotes(
          diagnostic.id,
          generalNotes,
        );

        for (
          const item of items
        ) {
          await diagnosticService.updateItem(
            item.id,
            item.status,
            item.notes ?? '',
          );
        }

        setToast({
          type: 'success',

          message:
            'Diagnóstico guardado correctamente.',
        });
      } catch (err) {
        console.error(
          'Error al guardar diagnóstico:',
          err,
        );

        setToast({
          type: 'error',

          message:
            'No se pudo guardar el diagnóstico. Si eres mecánico, verifica que la orden esté asignada a tu usuario.',
        });
      } finally {
        setSaving(false);
      }
    };

  const categories =
    Array.from(
      new Set(
        items.map(
          item => item.category,
        ),
      ),
    );

  if (
    !canManageDiagnostics
  ) {
    return (
      <Screen>
        <ScreenHeader
          title="Diagnóstico mecánico"
          subtitle="Revisión de componentes del vehículo"
          onBack={() =>
            router.back()
          }
        />

        <View
          style={
            styles.permissionContainer
          }
        >
          <Text
            style={
              styles.permissionTitle
            }
          >
            Sin permiso
          </Text>

          <Text
            style={
              styles.permissionText
            }
          >
            Tu usuario no tiene
            permiso para realizar
            diagnósticos.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title="Diagnóstico mecánico"
        subtitle="Revisión de componentes del vehículo"
        onBack={() =>
          router.back()
        }
      />

      {toast && (
        <View
          style={[
            styles.toast,

            toast.type ===
              'error' &&
              styles.toastError,
          ]}
        >
          <Text
            style={
              styles.toastIcon
            }
          >
            {toast.type ===
            'success'
              ? '✓'
              : '!'}
          </Text>

          <Text
            style={
              styles.toastText
            }
          >
            {toast.message}
          </Text>

          <Pressable
            onPress={() =>
              setToast(null)
            }
          >
            <Text
              style={
                styles.close
              }
            >
              ✕
            </Text>
          </Pressable>
        </View>
      )}

      {loading ? (
        <View
          style={
            styles.center
          }
        >
          <ActivityIndicator
            color={
              colors.primary
            }
          />

          <Text
            style={
              styles.help
            }
          >
            Cargando
            diagnóstico...
          </Text>
        </View>
      ) : error ? (
        <View
          style={
            styles.center
          }
        >
          <Text
            style={
              styles.error
            }
          >
            {error}
          </Text>

          <PrimaryButton
            label="Reintentar"
            onPress={() =>
              void loadDiagnostic()
            }
          />

          <Pressable
            style={
              styles.backButton
            }
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={
                styles.backText
              }
            >
              Volver a la orden
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={
            styles.scroll
          }
          contentContainerStyle={
            styles.container
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          <View
            style={
              styles.infoCard
            }
          >
            <Text
              style={
                styles.infoTitle
              }
            >
              Lista de revisión
            </Text>

            <Text
              style={
                styles.help
              }
            >
              Revisa cada
              componente y selecciona
              su estado. También
              puedes agregar
              observaciones.
            </Text>
          </View>

          {categories.map(
            category => (
              <View
                key={
                  category
                }
                style={
                  styles.card
                }
              >
                <Text
                  style={
                    styles.categoryTitle
                  }
                >
                  {category}
                </Text>

                {items
                  .filter(
                    item =>
                      item.category ===
                      category,
                  )
                  .map(
                    item => (
                      <View
                        key={
                          item.id
                        }
                        style={
                          styles.itemContainer
                        }
                      >
                        <Text
                          style={
                            styles.componentTitle
                          }
                        >
                          {
                            item.component
                          }
                        </Text>

                        <View
                          style={
                            styles.statusRow
                          }
                        >
                          {itemStatuses.map(
                            statusOption => {
                              const selected =
                                item.status ===
                                statusOption.value;

                              return (
                                <Pressable
                                  key={
                                    statusOption.value
                                  }
                                  disabled={
                                    saving
                                  }
                                  onPress={() =>
                                    changeItemStatus(
                                      item.id,
                                      statusOption.value,
                                    )
                                  }
                                  style={[
                                    styles.statusButton,

                                    selected &&
                                      styles.statusButtonSelected,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.statusText,

                                      selected &&
                                        styles.statusTextSelected,
                                    ]}
                                  >
                                    {
                                      statusOption.label
                                    }
                                  </Text>
                                </Pressable>
                              );
                            },
                          )}
                        </View>

                        <TextInput
                          style={
                            styles.input
                          }
                          placeholder="Observaciones del componente..."
                          placeholderTextColor={
                            colors.textMuted
                          }
                          value={
                            item.notes ??
                            ''
                          }
                          onChangeText={text =>
                            changeItemNotes(
                              item.id,
                              text,
                            )
                          }
                          editable={
                            !saving
                          }
                          multiline
                        />
                      </View>
                    ),
                  )}
              </View>
            ),
          )}

          <View
            style={
              styles.card
            }
          >
            <Text
              style={
                styles.categoryTitle
              }
            >
              Observaciones
              generales
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.generalInput,
              ]}
              placeholder="Describe el diagnóstico general del vehículo..."
              placeholderTextColor={
                colors.textMuted
              }
              value={
                generalNotes
              }
              onChangeText={
                setGeneralNotes
              }
              editable={
                !saving
              }
              multiline
              textAlignVertical="top"
            />
          </View>

          <PrimaryButton
            label={
              saving
                ? 'Guardando...'
                : 'Guardar diagnóstico'
            }
            onPress={() =>
              void handleSave()
            }
          />

          <Pressable
            disabled={
              saving
            }
            onPress={() =>
              router.back()
            }
            style={
              styles.backButton
            }
          >
            <Text
              style={
                styles.backText
              }
            >
              Volver a la orden
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles =
  StyleSheet.create({
    permissionContainer: {
      padding:
        spacing.lg,
    },

    permissionTitle: {
      color: '#C62828',
      fontSize: 20,
      fontWeight: '700',
      marginBottom:
        spacing.sm,
    },

    permissionText: {
      color:
        colors.textMuted,
      fontSize: 16,
      lineHeight: 22,
    },

    scroll: {
      flex: 1,
    },

    container: {
      paddingBottom: 60,
      gap: spacing.md,
    },

    center: {
      flex: 1,
      justifyContent:
        'center',
      alignItems:
        'center',
      gap: spacing.md,
    },

    infoCard: {
      padding:
        spacing.md,
      borderRadius: 12,
      backgroundColor:
        '#EAF2FF',
    },

    infoTitle: {
      fontSize: 19,
      fontWeight: '700',
      color: '#12345B',
      marginBottom: 8,
    },

    help: {
      fontSize: 15,
      color:
        colors.textMuted,
      lineHeight: 23,
    },

    card: {
      backgroundColor:
        colors.surface,

      padding:
        spacing.md,

      borderRadius: 12,

      gap: spacing.md,
    },

    categoryTitle: {
      fontSize: 21,
      fontWeight: '700',
      color: '#000',
    },

    itemContainer: {
      borderTopWidth: 1,

      borderTopColor:
        colors.border,

      paddingTop:
        spacing.md,

      gap: spacing.sm,
    },

    componentTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: '#000',
    },

    statusRow: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      gap: spacing.sm,
    },

    statusButton: {
      borderWidth: 1,

      borderColor:
        colors.border,

      borderRadius: 10,

      paddingVertical: 10,

      paddingHorizontal: 14,
    },

    statusButtonSelected: {
      backgroundColor:
        colors.primary,

      borderColor:
        colors.primary,
    },

    statusText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#000',
    },

    statusTextSelected: {
      color: '#FFF',
    },

    input: {
      borderWidth: 1,

      borderColor:
        colors.border,

      borderRadius: 10,

      padding: 12,

      fontSize: 15,

      color: '#000',

      backgroundColor:
        '#FFF',

      minHeight: 48,
    },

    generalInput: {
      minHeight: 120,
    },

    toast: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 12,

      padding: 14,

      borderRadius: 12,

      backgroundColor:
        '#ECFDF3',

      borderWidth: 1,

      borderColor:
        '#ABEFC6',

      marginBottom: 12,
    },

    toastError: {
      backgroundColor:
        '#FEF3F2',

      borderColor:
        '#FECDCA',
    },

    toastIcon: {
      fontSize: 22,

      fontWeight: '700',

      color: '#079455',
    },

    toastText: {
      flex: 1,

      fontSize: 14,

      fontWeight: '600',

      color: '#101828',
    },

    close: {
      fontSize: 18,

      color: '#667085',
    },

    error: {
      color: '#C62828',

      fontSize: 16,

      textAlign:
        'center',
    },

    backButton: {
      alignItems:
        'center',

      padding:
        spacing.md,
    },

    backText: {
      color:
        colors.primary,

      fontWeight: '600',

      fontSize: 15,
    },
  });