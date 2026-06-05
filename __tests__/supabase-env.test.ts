import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSupabaseEnv } from '@/lib/supabase/env';

describe('getSupabaseEnv', () => {
  const original = { ...process.env };

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it('URL が未設定なら例外を投げる', () => {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'key';
    expect(() => getSupabaseEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it('anon key が未設定なら例外を投げる', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co';
    expect(() => getSupabaseEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });

  it('両方設定されていれば値を返す', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    expect(getSupabaseEnv()).toEqual({ url: 'https://x.supabase.co', anonKey: 'anon-key' });
  });
});
