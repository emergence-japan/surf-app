import { describe, it, expect } from 'vitest';
import { parseCredentials, toJapaneseAuthError } from '@/app/login/validation';

function fd(email: unknown, password: unknown): FormData {
  const f = new FormData();
  if (email !== undefined) f.set('email', email as string);
  if (password !== undefined) f.set('password', password as string);
  return f;
}

describe('parseCredentials', () => {
  it('正しいメール・パスワードを通す', () => {
    const r = parseCredentials(fd('a@example.com', 'secret123'));
    expect(r.ok).toBe(true);
    expect(r.data).toEqual({ email: 'a@example.com', password: 'secret123' });
  });

  it('不正なメールを弾く', () => {
    const r = parseCredentials(fd('not-an-email', 'secret123'));
    expect(r.ok).toBe(false);
    expect(r.error).toContain('メールアドレス');
  });

  it('短すぎるパスワードを弾く', () => {
    const r = parseCredentials(fd('a@example.com', '123'));
    expect(r.ok).toBe(false);
    expect(r.error).toContain('6文字');
  });
});

describe('toJapaneseAuthError', () => {
  it('認証情報エラーを日本語にする', () => {
    expect(toJapaneseAuthError('Invalid login credentials')).toContain('正しくありません');
  });

  it('登録済みエラーを日本語にする', () => {
    expect(toJapaneseAuthError('User already registered')).toContain('既に登録');
  });

  it('未知のエラーは汎用メッセージにフォールバック', () => {
    expect(toJapaneseAuthError('some internal db error xyz')).toContain('認証に失敗');
  });

  it('未定義でもクラッシュしない', () => {
    expect(toJapaneseAuthError(undefined)).toContain('認証に失敗');
  });
});
