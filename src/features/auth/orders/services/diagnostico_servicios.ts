
import { supabase } from '@/lib/supabase/client';

import type {
  Diagnostic,
  DiagnosticItem,
  DiagnosticItemStatus,
} from './types/diagnostic';

import { diagnosticChecklist } from './types/diagnostic';

export const diagnosticService = {
  async getOrCreate(
    workOrderId: string,
  ): Promise<Diagnostic> {
    console.log(
      'DIAGNOSTIC: buscando diagnóstico para orden:',
      workOrderId,
    );

    const {
      data: existing,
      error: searchError,
    } = await supabase
      .from('diagnostics')
      .select('*')
      .eq('work_order_id', workOrderId)
      .maybeSingle();

    if (searchError) {
      console.error(
        'DIAGNOSTIC SEARCH ERROR:',
        searchError,
      );

      throw searchError;
    }

    if (existing) {
      console.log(
        'DIAGNOSTIC: diagnóstico existente:',
        existing.id,
      );

      return existing;
    }

    console.log(
      'DIAGNOSTIC: creando diagnóstico...',
    );

    const {
      data,
      error,
    } = await supabase
      .from('diagnostics')
      .insert({
        work_order_id: workOrderId,
      })
      .select('*')
      .single();

    if (error) {
      console.error(
        'DIAGNOSTIC CREATE ERROR:',
        error,
      );

      throw error;
    }

    console.log(
      'DIAGNOSTIC: diagnóstico creado:',
      data.id,
    );

    return data;
  },

  async listItems(
    diagnosticId: string,
  ): Promise<DiagnosticItem[]> {
    const {
      data,
      error,
    } = await supabase
      .from('diagnostic_items')
      .select('*')
      .eq(
        'diagnostic_id',
        diagnosticId,
      )
      .order('category')
      .order('component');

    if (error) {
      console.error(
        'DIAGNOSTIC ITEMS LIST ERROR:',
        error,
      );

      throw error;
    }

    return data ?? [];
  },

  async initializeChecklist(
    diagnosticId: string,
  ): Promise<DiagnosticItem[]> {
    console.log(
      'DIAGNOSTIC: cargando checklist:',
      diagnosticId,
    );

    const currentItems =
      await this.listItems(
        diagnosticId,
      );

    if (currentItems.length > 0) {
      return currentItems;
    }

    console.log(
      'DIAGNOSTIC: creando checklist inicial...',
    );

    const newItems =
      diagnosticChecklist.map(
        item => ({
          diagnostic_id: diagnosticId,
          category: item.category,
          component: item.component,
          status: 'REVIEW' as const,
        }),
      );

    const {
      error,
    } = await supabase
      .from('diagnostic_items')
      .insert(newItems);

    if (error) {
      console.error(
        'DIAGNOSTIC CHECKLIST CREATE ERROR:',
        error,
      );

      throw error;
    }

    /*
     * Después del INSERT volvemos
     * a consultar los elementos.
     *
     * INSERT
     *   ↓
     * SELECT
     */
    return await this.listItems(
      diagnosticId,
    );
  },

  async updateItem(
    id: string,
    status: DiagnosticItemStatus,
    notes: string,
  ): Promise<void> {
    const {
      error,
    } = await supabase
      .from('diagnostic_items')
      .update({
        status,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error(
        'DIAGNOSTIC ITEM UPDATE ERROR:',
        error,
      );

      throw error;
    }
  },

  async updateGeneralNotes(
    diagnosticId: string,
    notes: string,
  ): Promise<void> {
    const {
      error,
    } = await supabase
      .from('diagnostics')
      .update({
        general_notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', diagnosticId);

    if (error) {
      console.error(
        'DIAGNOSTIC NOTES UPDATE ERROR:',
        error,
      );

      throw error;
    }
  },

  async updateAiSummary(
    diagnosticId: string,
    summary: string,
  ): Promise<void> {
    const {
      error,
    } = await supabase
      .from('diagnostics')
      .update({
        ai_summary: summary.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', diagnosticId);

    if (error) {
      console.error(
        'AI SUMMARY UPDATE ERROR:',
        error,
      );

      throw error;
    }
  },
};
