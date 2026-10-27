import { supabase } from './supabase';

/**
 * Capa de Base de Datos Supabase (PostgreSQL)
 * Reemplaza node:sqlite con Supabase Cloud.
 */

// Helpers para compatibilidad asíncrona limpia
export { supabase };

export async function getSettingValue(key: string, defaultValue = ''): Promise<string> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single();

  if (error || !data) return defaultValue;
  return data.value;
}

export async function setSettingValue(key: string, value: string): Promise<boolean> {
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value });

  return !error;
}
