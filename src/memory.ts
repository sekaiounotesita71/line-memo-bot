import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";

export type MemoryRecord = {
  id: string;
  created_at: string;
  source_type: string;
  source_id: string | null;
  user_id: string | null;
  raw_text: string;
  summary: string;
};

export type PriceRow = {
  id?: string;
  created_at?: string;
  source_id?: string | null;
  file_name?: string | null;
  sheet_name: string;
  category?: string | null;
  product_name: string;
  origin?: string | null;
  size?: string | null;
  unit?: string | null;
  kg?: number | null;
  jp_price_low?: number | null;
  jp_price_high?: number | null;
  malaysia_low?: number | null;
  malaysia_high?: number | null;
  thailand_low?: number | null;
  thailand_high?: number | null;
  singapore_low?: number | null;
  singapore_high?: number | null;
  cambodia_case?: number | null;
  cambodia_kg?: number | null;
  raw_row?: Record<string, unknown>;
};

const supabase =
  config.supabaseUrl && config.supabaseServiceRoleKey
    ? createClient(config.supabaseUrl, config.supabaseServiceRoleKey)
    : null;

export function isMemoryEnabled(): boolean {
  return Boolean(supabase);
}

export async function saveMemory(input: {
  sourceType: string;
  sourceId?: string;
  userId?: string;
  rawText: string;
  summary: string;
}): Promise<void> {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("line_memories").insert({
    source_type: input.sourceType,
    source_id: input.sourceId ?? null,
    user_id: input.userId ?? null,
    raw_text: input.rawText,
    summary: input.summary
  });

  if (error) {
    throw error;
  }
}

export async function listRecentMemories(limit = 80): Promise<MemoryRecord[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("line_memories")
    .select("id, created_at, source_type, source_id, user_id, raw_text, summary")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function savePriceRows(rows: PriceRow[]): Promise<void> {
  if (!supabase || rows.length === 0) {
    return;
  }

  const { error } = await supabase.from("price_rows").insert(rows);

  if (error) {
    throw error;
  }
}

export async function listRecentPriceRows(limit = 120): Promise<PriceRow[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("price_rows")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
}
