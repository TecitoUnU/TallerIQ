import { z } from 'zod';

export const clientSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(
      2,
      'El nombre debe tener al menos 2 caracteres.',
    )
    .max(
      120,
      'El nombre es demasiado largo.',
    ),

  phone: z
    .string()
    .trim()
    .min(
      8,
      'El teléfono debe tener al menos 8 caracteres.',
    )
    .max(
      30,
      'El teléfono es demasiado largo.',
    ),

  email: z
    .string()
    .trim()
    .email(
      'Ingresa un correo válido.',
    )
    .or(z.literal('')),

  address: z
    .string()
    .trim()
    .max(
      250,
      'La dirección es demasiado larga.',
    ),

  notes: z
    .string()
    .trim()
    .max(
      1000,
      'Las notas son demasiado largas.',
    ),
});

export type ClientSchemaInput =
  z.infer<typeof clientSchema>;