// localStorage-based health data store
// Structure mirrors Supabase schema for easy migration

export interface HealthRecord {
  id: string;
  date: string; // ISO string
  source: "manual" | "scan";
  symptoms?: string;
  aiAnalysis?: string;
  subject?: string; // "self" (default) or custom name like "媽媽"
  data: Partial<Record<string, number | string>>;
}

export type SaveCloudResult =
  | { id: string; rotated?: boolean }
  | { id: null };

export interface UserProfile {
  age?: number;
  gender?: "M" | "F";
  name?: string;
}

const RECORDS_KEY = "cc-health-records";
const PROFILE_KEY = "cc-user-profile";

// ── localStorage CRUD ──────────────────────────────────────────

export function getRecords(): HealthRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECORDS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveRecord(record: Omit<HealthRecord, "id">): HealthRecord {
  const records = getRecords();
  const newRecord: HealthRecord = { ...record, id: Date.now().toString() };
  records.unshift(newRecord);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records.slice(0, 100)));
  return newRecord;
}

export function deleteRecord(id: string): void {
  const records = getRecords().filter((r) => r.id !== id);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

export function getProfile(): UserProfile {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

// ── Supabase 雲端 CRUD ─────────────────────────────────────────

import { createClient } from "./supabase";

const CLOUD_RECORD_LIMIT = 100;

export async function saveRecordCloud(
  record: Omit<HealthRecord, "id">
): Promise<SaveCloudResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { id: null };

  // Check if at limit (for rotated flag)
  const { count } = await supabase
    .from("health_records")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);
  const willRotate = (count ?? 0) >= CLOUD_RECORD_LIMIT;

  // Supabase trigger handles auto-delete of oldest record if over limit
  const { data, error } = await supabase
    .from("health_records")
    .insert({
      user_id: user.id,
      type: record.source,
      data: {
        ...record.data,
        _symptoms: record.symptoms ?? null,
        _subject: record.subject ?? "self",
      },
      ai_analysis: record.aiAnalysis ?? null,
    })
    .select("id")
    .single();

  if (error) return { id: null };
  return { id: data.id, rotated: willRotate };
}

export async function getRecordsCloud(): Promise<HealthRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("health_records")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    const { _symptoms, _subject, ...values } = row.data ?? {};
    return {
      id: row.id,
      date: row.created_at,
      source: row.type as "manual" | "scan",
      symptoms: _symptoms ?? undefined,
      subject: (_subject as string) ?? "self",
      aiAnalysis: row.ai_analysis ?? undefined,
      data: values,
    };
  });
}

export async function deleteRecordCloud(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("health_records").delete().eq("id", id);
}
