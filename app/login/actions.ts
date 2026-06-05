'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { parseCredentials, toJapaneseAuthError } from './validation';

export interface AuthActionResult {
  error?: string;
}

// ログイン後の戻り先。オープンリダイレクトを防ぐため、
// 同一オリジンの相対パス（/ で始まる）だけを許可する。
function safeNext(next: FormDataEntryValue | null): string {
  if (typeof next === 'string' && next.startsWith('/') && !next.startsWith('//')) {
    return next;
  }
  return '/';
}

export async function signInWithPassword(
  _prev: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const parsed = parseCredentials(formData);
  if (!parsed.ok || !parsed.data) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: toJapaneseAuthError(error.message) };

  redirect(safeNext(formData.get('next')));
}

export async function signUpWithPassword(
  _prev: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const parsed = parseCredentials(formData);
  if (!parsed.ok || !parsed.data) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp(parsed.data);
  if (error) return { error: toJapaneseAuthError(error.message) };

  redirect(safeNext(formData.get('next')));
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
