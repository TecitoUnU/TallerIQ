import { z } from 'zod';

const requiredTrimmed = (label: string, min = 1) =>
  z
    .string()
    .trim()
    .min(min, `${label} es obligatorio.`);

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Ingresa un correo válido.'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

export const registerSchema = z
  .object({
    fullName: requiredTrimmed('El nombre completo', 2),
    email: z.string().trim().email('Ingresa un correo válido.'),
    phone: z
      .string()
      .trim()
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(6, 'La contraseña debe tener al menos 6 caracteres.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Ingresa un correo válido.'),
});

export const updateProfileSchema = z.object({
  fullName: requiredTrimmed('El nombre completo', 2),
  phone: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;
