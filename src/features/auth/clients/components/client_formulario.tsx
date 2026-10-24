import {
  zodResolver,
} from '@hookform/resolvers/zod';

import {
  Controller,
  useForm,
} from 'react-hook-form';

import {
  StyleSheet,
  View,
} from 'react-native';

import {
  PrimaryButton,
} from '@/components/ui/PrimaryButton';

import {
  TextField,
} from '@/components/ui/TextField';

import type {
  ClientFormValues,
} from '@/features/auth/clients/types/client';

import {
  clientSchema,
} from '@/features/auth/clients/validations/client_schemas';

import {
  spacing,
} from '@/theme';

type Props = {
  initialValues?:
    Partial<ClientFormValues>;

  submitLabel: string;

  loading?: boolean;

  onSubmit:
    (
      values:
        ClientFormValues,
    ) =>
      Promise<void> | void;
};

const defaults:
  ClientFormValues = {
    fullName: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  };

export function ClientForm({
  initialValues,
  submitLabel,
  loading = false,
  onSubmit,
}: Props) {
  const {
    control,
    handleSubmit,

    formState: {
      errors,
    },
  } =
    useForm<ClientFormValues>({
      resolver:
        zodResolver(
          clientSchema,
        ),

      defaultValues: {
        ...defaults,
        ...initialValues,
      },
    });

  return (
    <View
      style={styles.form}
    >
      <Controller
        control={control}
        name="fullName"
        render={({
          field,
        }) => (
          <TextField
            label="Nombre completo *"
            placeholder="Ej. Carlos Méndez"
            value={
              field.value
            }
            onChangeText={
              field.onChange
            }
            onBlur={
              field.onBlur
            }
            error={
              errors
                .fullName
                ?.message
            }
            autoCapitalize="words"
          />
        )}
      />

      <Controller
        control={control}
        name="phone"
        render={({
          field,
        }) => (
          <TextField
            label="Teléfono *"
            placeholder="Ej. 5555 5555"
            value={
              field.value
            }
            onChangeText={
              field.onChange
            }
            onBlur={
              field.onBlur
            }
            error={
              errors
                .phone
                ?.message
            }
            keyboardType="phone-pad"
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({
          field,
        }) => (
          <TextField
            label="Correo electrónico"
            placeholder="cliente@correo.com"
            value={
              field.value
            }
            onChangeText={
              field.onChange
            }
            onBlur={
              field.onBlur
            }
            error={
              errors
                .email
                ?.message
            }
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}
      />

      <Controller
        control={control}
        name="address"
        render={({
          field,
        }) => (
          <TextField
            label="Dirección"
            placeholder="Dirección del cliente"
            value={
              field.value
            }
            onChangeText={
              field.onChange
            }
            onBlur={
              field.onBlur
            }
            error={
              errors
                .address
                ?.message
            }
          />
        )}
      />

      <Controller
        control={control}
        name="notes"
        render={({
          field,
        }) => (
          <TextField
            label="Notas"
            placeholder="Información adicional"
            value={
              field.value
            }
            onChangeText={
              field.onChange
            }
            onBlur={
              field.onBlur
            }
            error={
              errors
                .notes
                ?.message
            }
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={
              styles.notes
            }
          />
        )}
      />

      <PrimaryButton
        label={
          submitLabel
        }
        loading={
          loading
        }
        onPress={
          handleSubmit(
            onSubmit,
          )
        }
        style={
          styles.button
        }
      />
    </View>
  );
}

const styles =
  StyleSheet.create({
    form: {
      gap: spacing.lg,
    },

    notes: {
      minHeight: 96,
    },

    button: {
      marginTop:
        spacing.sm,
    },
  });