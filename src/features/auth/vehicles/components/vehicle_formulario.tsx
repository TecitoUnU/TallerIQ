import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker'
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import { Image, StyleSheet, Text, View, Pressable } from 'react-native';
import { ClientSelector } from '@/features/auth/vehicles/components/client_selector';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TextField } from '@/components/ui/TextField';
import { vehicleSchema } from '@/features/auth/vehicles/validations/vehicle_schemas';
import type { VehicleFormValues } from '@/features/auth/vehicles/types/vehicle';
import { spacing, typography } from '@/theme';

type Props = {
  initialValues?: Partial<VehicleFormValues>;
  submitLabel?: string;
  loading?: boolean;
  onSubmit: (values: VehicleFormValues) => void;
};

export function VehicleForm({
  initialValues,
  submitLabel = 'Guardar vehículo',
  loading = false,
  onSubmit,
}: Props) {
  
    const [photoUri, setPhotoUri] = useState(initialValues?.photoUrl ?? '');

  const {
    control,
    handleSubmit,
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
   defaultValues: {
    clientId: initialValues?.clientId ?? '',
    plate: initialValues?.plate ?? '',
    brand: initialValues?.brand ?? '',
    model: initialValues?.model ?? '',
    year: initialValues?.year ?? '',
    mileage: initialValues?.mileage ?? '',
    color: initialValues?.color ?? '',
    vin: initialValues?.vin ?? '',
    notes: initialValues?.notes ?? '',
    photoUrl: initialValues?.photoUrl ?? '',},
  });
const pickImage = async () => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (!result.canceled) {
    setPhotoUri(result.assets[0].uri);
  }
};
  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="clientId"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <ClientSelector
            value={value}
            onChange={onChange}
            error={error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="plate"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <TextField
            label="Placa"
            placeholder="Ej. P123ABC"
            value={value}
            onChangeText={onChange}
            autoCapitalize="characters"
            error={error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="brand"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <TextField
            label="Marca"
            placeholder="Ej. Toyota"
            value={value}
            onChangeText={onChange}
            error={error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="model"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <TextField
            label="Modelo"
            placeholder="Ej. Corolla"
            value={value}
            onChangeText={onChange}
            error={error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="year"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <TextField
            label="Año"
            placeholder="Ej. 2020"
            value={value}
            onChangeText={onChange}
            keyboardType="numeric"
            error={error?.message}
          />
        )}
      />

      <Controller
  control={control}
  name="mileage"
  render={({ field: { onChange, value }, fieldState: { error } }) => (
    <TextField
      label="Kilometraje"
      placeholder="Ej. 85000"
      value={value}
      onChangeText={onChange}
      keyboardType="numeric"
      error={error?.message}
    />
  )}
/>

<Controller
  control={control}
  name="color"
  render={({ field: { onChange, value }, fieldState: { error } }) => (
    <TextField
      label="Color"
      placeholder="Ej. Blanco"
      value={value}
      onChangeText={onChange}
      error={error?.message}
    />
  )}
/>

<Controller
  control={control}
  name="vin"
  render={({ field: { onChange, value }, fieldState: { error } }) => (
    <TextField
      label="VIN"
      placeholder="Ej. 1HGBH41JXMN109186"
      value={value}
      onChangeText={onChange}
      autoCapitalize="characters"
      error={error?.message}
    />
  )}
/>

<View style={styles.photoSection}>
  <Text style={styles.photoLabel}>Foto del vehículo</Text>

  {photoUri ? (
    <Image
      source={{ uri: photoUri }}
      style={styles.photoPreview}
      resizeMode="cover"
    />
  ) : (
    <View style={styles.photoPlaceholder}>
      <Text style={styles.photoPlaceholderText}>
        No hay una foto seleccionada
      </Text>
    </View>
  )}

  <Pressable
    onPress={pickImage}
    style={({ pressed }) => [
      styles.photoButton,
      pressed && styles.photoButtonPressed,
    ]}
  >
    <Text style={styles.photoButtonText}>
      {photoUri ? 'Cambiar foto' : 'Seleccionar foto'}
    </Text>
  </Pressable>

  {photoUri ? (
    <Pressable onPress={() => setPhotoUri('')}>
      <Text style={styles.removePhoto}>Eliminar foto</Text>
    </Pressable>
  ) : null}
</View>

<Controller
  control={control}
  name="notes"
  render={({ field: { onChange, value }, fieldState: { error } }) => (
    <TextField
      label="Notas"
      placeholder="Información adicional del vehículo"
      value={value}
      onChangeText={onChange}
      multiline
      numberOfLines={4}
      textAlignVertical="top"
      error={error?.message}
    />
  )}
/>

      <PrimaryButton
        label={submitLabel}
        onPress={handleSubmit((values) =>
  onSubmit({
    ...values,
    photoUrl: photoUri,
  })
)}
        loading={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  photoSection: {
  gap: spacing.sm,
},

photoLabel: {
  fontSize: typography.size.md,
  fontWeight: '600',
  color: '#1A2B3C',
},

photoPreview: {
  width: '100%',
  height: 220,
  borderRadius: 12,
},

photoPlaceholder: {
  width: '100%',
  height: 160,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#D5DCE3',
  alignItems: 'center',
  justifyContent: 'center',
},

photoPlaceholderText: {
  color: '#7A8794',
  fontSize: typography.size.sm,
},

photoButton: {
  minHeight: 48,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#1A73E8',
  alignItems: 'center',
  justifyContent: 'center',
},

photoButtonPressed: {
  opacity: 0.7,
},

photoButtonText: {
  color: '#1A73E8',
  fontSize: typography.size.md,
  fontWeight: '700',
},

removePhoto: {
  textAlign: 'center',
  color: '#D64545',
  fontSize: typography.size.sm,
  fontWeight: '600',
},
});