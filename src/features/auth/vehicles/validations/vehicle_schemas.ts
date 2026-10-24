import { z } from 'zod';

export const vehicleSchema = z.object({
  clientId: z
    .string()
    .min(1, 'Debes seleccionar un cliente'),

  plate: z
    .string()
    .trim()
    .min(2, 'La placa es obligatoria')
    .max(20, 'La placa es demasiado larga'),

  brand: z
    .string()
    .trim()
    .min(2, 'La marca es obligatoria')
    .max(50, 'La marca es demasiado larga'),

  model: z
    .string()
    .trim()
    .min(1, 'El modelo es obligatorio')
    .max(50, 'El modelo es demasiado largo'),

  year: z
    .string()
    .trim()
    .min(4, 'Ingresa el año')
    .max(4, 'El año debe tener 4 dígitos')
    .regex(/^\d{4}$/, 'El año debe contener solo números'),

  mileage: z
    .string()
    .trim()
    .regex(/^\d*$/, 'El kilometraje debe contener solo números'),

  color: z
    .string()
    .trim()
    .max(30, 'El color es demasiado largo'),

  vin: z
    .string()
    .trim()
    .max(50, 'El VIN es demasiado largo'),

  notes: z
    .string()
    .trim()
    .max(500, 'Las notas son demasiado largas'),
  photoUrl: z.string(),
});

export type VehicleSchemaValues = z.infer<typeof vehicleSchema>;