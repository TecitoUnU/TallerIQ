
import { supabase } from '@/lib/supabase/client';

export type EvidenceType = 'BEFORE' | 'DURING' | 'AFTER';

export type Evidence = {
  id: string;
  work_order_id: string;
  diagnostic_id: string | null;
  type: EvidenceType;
  image_url: string;
  description: string | null;
  created_at: string;
};

const BUCKET = 'evidence';

export const evidenceService = {
  async upload(
    workOrderId: string,
    diagnosticId: string | null,
    type: EvidenceType,
    uri: string,
    description: string,
  ): Promise<Evidence> {
    // Obtener el archivo seleccionado
    const response = await fetch(uri);

    if (!response.ok) {
      throw new Error('No se pudo leer la imagen.');
    }

    const blob = await response.blob();

    // Validar el tipo de imagen
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(blob.type)) {
      throw new Error(
        'Selecciona una imagen JPG, PNG o WebP.'
      );
    }

    // El bucket permite archivos de hasta 5 MB
    if (blob.size > 5 * 1024 * 1024) {
      throw new Error(
        'La imagen no debe superar los 5 MB.'
      );
    }

    const extension =
      blob.type === 'image/png'
        ? 'png'
        : blob.type === 'image/webp'
          ? 'webp'
          : 'jpg';

    const uniqueId =
      Math.random().toString(36).slice(2, 10);

    const path =
      `${workOrderId}/${Date.now()}-${uniqueId}.${extension}`;

    // Subir la fotografía a Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, {
        contentType: blob.type,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Registrar la fotografía en la base de datos
    const { data, error } = await supabase
      .from('evidence')
      .insert({
        work_order_id: workOrderId,
        diagnostic_id: diagnosticId,
        type,
        image_url: path,
        description: description.trim() || null,
      })
      .select('*')
      .single();

    if (error) {
      // Intentar limpiar el archivo si falla el registro
      const { error: cleanupError } = await supabase.storage
        .from(BUCKET)
        .remove([path]);

      if (cleanupError) {
        console.error(
          'No se pudo limpiar la imagen:',
          cleanupError
        );
      }

      throw error;
    }

    return data as Evidence;
  },

  async list(workOrderId: string): Promise<Evidence[]> {
    const { data, error } = await supabase
      .from('evidence')
      .select('*')
      .eq('work_order_id', workOrderId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? []) as Evidence[];
  },

  async getSignedUrl(path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 3600);

    if (error) throw error;

    return data.signedUrl;
  },
};
