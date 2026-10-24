
import { useCallback, useRef, useState } from 'react';

import {
  ActivityIndicator,
  Image,
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

import {
  evidenceService,
  type Evidence,
  type EvidenceType,
} from '@/features/auth/orders/services/evidencia_servicios';

import { colors, spacing } from '@/theme';

type EvidenceWithUrl = Evidence & {
  signedUrl: string | null;
};

const types: {
  label: string;
  value: EvidenceType;
}[] = [
  { label: 'Antes', value: 'BEFORE' },
  { label: 'Después', value: 'AFTER' },
];

export default function EvidenceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const inputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [type, setType] = useState<EvidenceType>('BEFORE');
  const [description, setDescription] = useState('');

  const [evidences, setEvidences] =
    useState<EvidenceWithUrl[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadEvidences = useCallback(async () => {
    if (!id) {
      setError('No se encontró la orden.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await evidenceService.list(id);

      const results = await Promise.all(
        data.map(async item => {
          try {
            const signedUrl =
              await evidenceService.getSignedUrl(
                item.image_url
              );

            return { ...item, signedUrl };
          } catch (err) {
            console.error(
              'Error al obtener URL de imagen:',
              err
            );

            return { ...item, signedUrl: null };
          }
        })
      );

      setEvidences(results);
    } catch (err) {
      console.error('Error al cargar evidencias:', err);
      setError('No se pudieron cargar las evidencias.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void loadEvidences();
    }, [loadEvidences])
  );

  const handleSelectFile = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Selecciona una imagen JPG, PNG o WebP.');
      event.target.value = '';
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5 MB.');
      event.target.value = '';
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    const previewUrl = URL.createObjectURL(selectedFile);

    setFile(selectedFile);
    setPreview(previewUrl);
    setError(null);
    setMessage(null);

    event.target.value = '';
  };

  const handleUpload = async () => {
    if (!id || !file || saving) {
      setError('Primero selecciona una fotografía.');
      return;
    }

    let temporaryUrl: string | null = null;

    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      temporaryUrl = URL.createObjectURL(file);

      await evidenceService.upload(
        id,
        null,
        type,
        temporaryUrl,
        description
      );

      setMessage('Fotografía guardada correctamente.');

      setFile(null);
      setDescription('');
      setType('BEFORE');

      if (preview) {
        URL.revokeObjectURL(preview);
        setPreview(null);
      }

      await loadEvidences();
    } catch (err) {
      console.error('Error al subir evidencia:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo guardar la fotografía.'
      );
    } finally {
      if (temporaryUrl) {
        URL.revokeObjectURL(temporaryUrl);
      }

      setSaving(false);
    }
  };

  const getTypeLabel = (value: EvidenceType) => {
    if (value === 'BEFORE') return 'Antes';
    if (value === 'AFTER') return 'Después';
    return 'Durante';
  };

  return (
    <Screen>
      <ScreenHeader
        title="Evidencias fotográficas"
        subtitle="Fotografías de la reparación"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {message && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              ✓ {message}
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Agregar fotografía
          </Text>

          <Text style={styles.help}>
            Selecciona una imagen del vehículo o del
            componente reparado.
          </Text>

          {/* Selector de archivos exclusivo de Expo Web */}
          <View>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </View>

          <Pressable
            style={styles.selectButton}
            onPress={handleSelectFile}
            disabled={saving}
          >
            <Text style={styles.selectButtonText}>
              Seleccionar fotografía
            </Text>
          </Pressable>

          {preview && (
            <Image
              source={{ uri: preview }}
              style={styles.preview}
              resizeMode="contain"
            />
          )}

          {file && (
            <Text style={styles.help}>
              Archivo: {file.name}
            </Text>
          )}

          <Text style={styles.label}>
            Tipo de evidencia
          </Text>

          <View style={styles.typeContainer}>
            {types.map(item => {
              const selected = type === item.value;

              return (
                <Pressable
                  key={item.value}
                  disabled={saving}
                  onPress={() => setType(item.value)}
                  style={[
                    styles.typeButton,
                    selected && styles.typeSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeText,
                      selected && styles.typeTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>
            Descripción (opcional)
          </Text>

          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Ej. Pastillas de freno desgastadas"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            multiline
            editable={!saving}
          />

          <PrimaryButton
            label={saving ? 'Guardando...' : 'Guardar fotografía'}
            onPress={() => void handleUpload()}
          />

          {saving && (
            <ActivityIndicator color={colors.primary} />
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Fotografías registradas
          </Text>

          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : evidences.length === 0 ? (
            <Text style={styles.help}>
              Todavía no hay fotografías registradas.
            </Text>
          ) : (
            evidences.map(item => (
              <View
                key={item.id}
                style={styles.evidenceCard}
              >
                <Text style={styles.evidenceTitle}>
                  {getTypeLabel(item.type)}
                </Text>

                {item.signedUrl ? (
                  <Image
                    source={{ uri: item.signedUrl }}
                    style={styles.evidenceImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.errorText}>
                    No se pudo cargar la fotografía.
                  </Text>
                )}

                {item.description && (
                  <Text style={styles.description}>
                    {item.description}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>

       <Pressable
  onPress={() => router.replace(`/orders/${id}`)}
  style={styles.backButton}
>
  <Text style={styles.backText}>
    Volver a la orden
  </Text>
</Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },

  container: {
    gap: spacing.md,
    paddingBottom: 50,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.md,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },

  help: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },

  selectButton: {
    backgroundColor: '#EAF2FF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },

  selectButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },

  preview: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },

  typeContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  typeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
  },

  typeSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  typeText: {
    color: '#000',
    fontWeight: '600',
  },

  typeTextSelected: {
    color: '#FFF',
  },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#FFF',
    color: '#000',
    minHeight: 80,
    fontSize: 15,
    textAlignVertical: 'top',
  },

  evidenceCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },

  evidenceTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },

  evidenceImage: {
    width: '100%',
    height: 240,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },

  description: {
    color: '#000',
    fontSize: 15,
  },

  successBox: {
    backgroundColor: '#D4EDDA',
    borderRadius: 10,
    padding: spacing.md,
  },

  successText: {
    color: '#155724',
    fontWeight: '600',
  },

  errorBox: {
    backgroundColor: '#FDECEC',
    borderRadius: 10,
    padding: spacing.md,
  },

  errorText: {
    color: '#C62828',
    fontSize: 15,
  },

  backButton: {
    alignItems: 'center',
    padding: spacing.md,
  },

  backText: {
    color: colors.primary,
    fontWeight: '600',
  },
});
