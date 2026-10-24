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
import Markdown from 'react-native-markdown-display';

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
import { supabase } from '@/lib/supabase/client';
import { colors, spacing } from '@/theme';

const itemStatuses: {
  label: string;
  value: DiagnosticItemStatus;
}[] = [
  { label: 'Correcto', value: 'OK' },
  { label: 'Revisar', value: 'REVIEW' },
  { label: 'Reemplazar', value: 'REPLACE' },
];

type Toast = {
  type: 'success' | 'error';
  message: string;
};

export default function DiagnosticScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { canManageDiagnostics } = useAuth();

  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null);
  const [items, setItems] = useState<DiagnosticItem[]>([]);
  const [generalNotes, setGeneralNotes] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [aiReport, setAiReport] = useState('');
  const [editingReport, setEditingReport] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadDiagnostic = useCallback(async () => {
    if (!canManageDiagnostics) {
      setError(
        'Tu usuario no tiene permiso para trabajar con diagnósticos.',
      );
      setLoading(false);
      return;
    }

    if (!id) {
      setError('No se encontró la orden.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const diagnosticData = await diagnosticService.getOrCreate(id);
      const diagnosticItems =
        await diagnosticService.initializeChecklist(diagnosticData.id);

      setDiagnostic(diagnosticData);
      setItems(diagnosticItems);
      setGeneralNotes(diagnosticData.general_notes ?? '');
      setAiReport(diagnosticData.ai_summary ?? '');
      setEditingReport(false);
    } catch (err) {
      console.error('Error al cargar diagnóstico:', err);
      setError(
        'No se pudo cargar el diagnóstico. Comprueba los permisos y la asignación de la orden.',
      );
    } finally {
      setLoading(false);
    }
  }, [id, canManageDiagnostics]);

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
        item.id === itemId ? { ...item, status } : item,
      ),
    );
  };

  const changeItemNotes = (itemId: string, notes: string) => {
    setItems(previous =>
      previous.map(item =>
        item.id === itemId ? { ...item, notes } : item,
      ),
    );
  };

  const handleGenerateAI = async () => {
    if (!id || !diagnostic) {
      setToast({
        type: 'error',
        message: 'Primero debes cargar el diagnóstico.',
      });
      return;
    }

    if (!symptoms.trim()) {
      setToast({
        type: 'error',
        message: 'Describe los síntomas del vehículo primero.',
      });
      return;
    }

    if (generating || saving) return;

    try {
      setGenerating(true);
      setToast(null);

      const { data, error } = await supabase.functions.invoke(
        'generate-diagnostic',
        {
          body: {
            workOrderId: id,
            symptoms: symptoms.trim(),
          },
        },
      );

      if (error) {
        throw error;
      }

      if (!data?.report || typeof data.report !== 'string') {
        throw new Error(
          data?.error ?? 'No se recibió el informe de la IA.',
        );
      }

      setAiReport(data.report);
      setEditingReport(false);

      setToast({
        type: 'success',
        message: 'Reporte generado. Revísalo antes de guardarlo.',
      });
    } catch (err) {
      console.error('Error al generar sugerencias:', err);

      setToast({
        type: 'error',
        message:
          'No se pudo generar el reporte. Comprueba la conexión y la configuración de Supabase.',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!canManageDiagnostics) {
      setToast({
        type: 'error',
        message: 'No tienes permiso para guardar diagnósticos.',
      });
      return;
    }

    if (!diagnostic || saving || generating) return;

    try {
      setSaving(true);
      setToast(null);

      await diagnosticService.updateGeneralNotes(
        diagnostic.id,
        generalNotes,
      );

      for (const item of items) {
        await diagnosticService.updateItem(
          item.id,
          item.status,
          item.notes ?? '',
        );
      }

      if (aiReport.trim()) {
        await diagnosticService.updateAiSummary(
          diagnostic.id,
          aiReport,
        );
      }

      setToast({
        type: 'success',
        message: 'Diagnóstico guardado correctamente.',
      });
    } catch (err) {
      console.error('Error al guardar diagnóstico:', err);

      setToast({
        type: 'error',
        message:
          'No se pudo guardar. Verifica los permisos de la orden.',
      });
    } finally {
      setSaving(false);
    }
  };

  const categories = Array.from(
    new Set(items.map(item => item.category)),
  );

  if (!canManageDiagnostics) {
    return (
      <Screen>
        <ScreenHeader
          title="Diagnóstico mecánico"
          subtitle="Revisión del vehículo"
          onBack={() => router.back()}
        />

        <View style={styles.center}>
          <Text style={styles.error}>
            Tu usuario no tiene permiso para realizar diagnósticos.
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
        onBack={() => router.back()}
      />

      {toast ? (
        <View
          style={[
            styles.toast,
            toast.type === 'error' && styles.toastError,
          ]}
        >
          <Text style={styles.toastText}>{toast.message}</Text>

          <Pressable onPress={() => setToast(null)}>
            <Text style={styles.close}>×</Text>
          </Pressable>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.help}>Cargando diagnóstico...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>

          <PrimaryButton
            label="Reintentar"
            onPress={() => void loadDiagnostic()}
          />

          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>Volver a la orden</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              Asistente de diagnóstico con IA
            </Text>

            <Text style={styles.help}>
              Describe los síntomas del vehículo para obtener un
              informe técnico preliminar. Las sugerencias deben
              comprobarse mediante inspección mecánica.
            </Text>

            <TextInput
              style={[styles.input, styles.symptomsInput]}
              placeholder="Ej.: el carro vibra cuando freno y truena al pasar túmulos..."
              placeholderTextColor={colors.textMuted}
              value={symptoms}
              onChangeText={setSymptoms}
              editable={!generating && !saving}
              multiline
              textAlignVertical="top"
              maxLength={4000}
            />

            <Pressable
              style={[
                styles.aiButton,
                (generating || saving) && styles.buttonDisabled,
              ]}
              onPress={() => void handleGenerateAI()}
              disabled={generating || saving}
            >
              {generating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.aiButtonText}>
                  ✦ Generar reporte técnico con IA
                </Text>
              )}
            </Pressable>
          </View>

          {aiReport ? (
            <View style={styles.card}>
              <View style={styles.reportHeader}>
                <View style={styles.reportIcon}>
                  <Text style={styles.reportIconText}>✦</Text>
                </View>

                <View style={styles.reportHeaderText}>
                  <Text style={styles.categoryTitle}>
                    Reporte técnico
                  </Text>
                  <Text style={styles.help}>
                    Informe preliminar generado con IA
                  </Text>
                </View>
              </View>

              <View style={styles.reportNotice}>
                <Text style={styles.reportNoticeText}>
                  Revisa las recomendaciones y confirma los hallazgos
                  mediante una inspección mecánica antes de tomar
                  decisiones.
                </Text>
              </View>

              {editingReport ? (
                <TextInput
                  style={[styles.input, styles.reportInput]}
                  value={aiReport}
                  onChangeText={setAiReport}
                  editable={!saving && !generating}
                  multiline
                  textAlignVertical="top"
                />
              ) : (
                <View style={styles.markdownBox}>
                  <Markdown style={reportMarkdownStyles}>
                    {aiReport
                      .replace(/\\\*/g, '*')
                      .replace(/\\n/g, '\n')}
                  </Markdown>
                </View>
              )}

              <Pressable
                style={styles.editReportButton}
                onPress={() => setEditingReport(!editingReport)}
                disabled={saving || generating}
              >
                <Text style={styles.editReportText}>
                  {editingReport
                    ? 'Vista previa del informe'
                    : 'Editar informe'}
                </Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Lista de revisión</Text>

            <Text style={styles.help}>
              Selecciona el estado de cada componente y agrega
              observaciones según la inspección realizada.
            </Text>
          </View>

          {categories.map(category => (
            <View key={category} style={styles.card}>
              <Text style={styles.categoryTitle}>{category}</Text>

              {items
                .filter(item => item.category === category)
                .map(item => (
                  <View key={item.id} style={styles.itemContainer}>
                    <Text style={styles.componentTitle}>
                      {item.component}
                    </Text>

                    <View style={styles.statusRow}>
                      {itemStatuses.map(option => {
                        const selected = item.status === option.value;

                        return (
                          <Pressable
                            key={option.value}
                            disabled={saving || generating}
                            onPress={() =>
                              changeItemStatus(item.id, option.value)
                            }
                            style={[
                              styles.statusButton,
                              selected && styles.statusButtonSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusText,
                                selected && styles.statusTextSelected,
                              ]}
                            >
                              {option.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    <TextInput
                      style={styles.input}
                      placeholder="Observaciones del componente..."
                      placeholderTextColor={colors.textMuted}
                      value={item.notes ?? ''}
                      onChangeText={text =>
                        changeItemNotes(item.id, text)
                      }
                      editable={!saving && !generating}
                      multiline
                    />
                  </View>
                ))}
            </View>
          ))}

          <View style={styles.card}>
            <Text style={styles.categoryTitle}>
              Observaciones generales
            </Text>

            <TextInput
              style={[styles.input, styles.generalInput]}
              placeholder="Describe las observaciones del vehículo..."
              placeholderTextColor={colors.textMuted}
              value={generalNotes}
              onChangeText={setGeneralNotes}
              editable={!saving && !generating}
              multiline
              textAlignVertical="top"
            />
          </View>

          <PrimaryButton
            label={saving ? 'Guardando...' : 'Guardar diagnóstico'}
            onPress={() => void handleSave()}
            disabled={saving || generating}
          />

          <Pressable
            disabled={saving || generating}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>Volver a la orden</Text>
          </Pressable>
        </ScrollView>
      )}
    </Screen>
  );
}

const reportMarkdownStyles = {
  body: {
    color: '#243247',
    fontSize: 14,
    lineHeight: 23,
  },
  heading1: {
    color: '#12345B',
    fontSize: 21,
    fontWeight: 'bold' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  heading2: {
    color: '#12345B',
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginTop: 14,
    marginBottom: 7,
  },
  heading3: {
    color: '#2457C5',
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginTop: 10,
    marginBottom: 5,
  },
  strong: {
    color: '#172B4D',
    fontWeight: 'bold' as const,
  },
  paragraph: {
    marginTop: 3,
    marginBottom: 9,
  },
  bullet_list: {
    marginBottom: 8,
  },
  ordered_list: {
    marginBottom: 8,
  },
  list_item: {
    marginBottom: 5,
  },
  hr: {
    backgroundColor: '#D9E2EC',
    height: 1,
    marginTop: 10,
    marginBottom: 10,
  },
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    paddingBottom: 60,
    gap: spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  infoCard: {
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: '#EAF2FF',
    gap: spacing.sm,
  },
  infoTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#12345B',
  },
  help: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 23,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.md,
  },
  categoryTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#12345B',
  },
  itemContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  componentTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    minHeight: 48,
  },
  symptomsInput: {
    minHeight: 100,
  },
  reportInput: {
    minHeight: 260,
  },
  generalInput: {
    minHeight: 120,
  },
  aiButton: {
    backgroundColor: '#2457C5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  aiButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  reportIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportIconText: {
    color: '#2457C5',
    fontSize: 26,
    fontWeight: '700',
  },
  reportHeaderText: {
    flex: 1,
    gap: 4,
  },
  reportNotice: {
    padding: spacing.md,
    backgroundColor: '#FFF7E6',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F5D99A',
  },
  reportNoticeText: {
    color: '#795313',
    fontSize: 13,
    lineHeight: 20,
  },
  markdownBox: {
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
  },
  editReportButton: {
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editReportText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statusButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  statusButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  statusTextSelected: {
    color: '#FFFFFF',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#ECFDF3',
    borderWidth: 1,
    borderColor: '#ABEFC6',
    marginBottom: 12,
  },
  toastError: {
    backgroundColor: '#FEF3F2',
    borderColor: '#FECDCA',
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#101828',
  },
  close: {
    fontSize: 22,
    color: '#667085',
  },
  error: {
    color: '#C62828',
    fontSize: 16,
    textAlign: 'center',
  },
  backButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  backText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 15,
  },
});