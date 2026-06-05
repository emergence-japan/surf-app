import { z } from 'zod';

// ログイン・新規登録フォームの入力検証（境界バリデーション）。
export const credentialsSchema = z.object({
  email: z.string().email('メールアドレスの形式が正しくありません。'),
  password: z.string().min(6, 'パスワードは6文字以上にしてください。'),
});

export type Credentials = z.infer<typeof credentialsSchema>;

export interface ParsedCredentials {
  ok: boolean;
  data?: Credentials;
  error?: string;
}

// FormData から認証情報を取り出して検証する。
export function parseCredentials(formData: FormData): ParsedCredentials {
  const result = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!result.success) {
    return { ok: false, error: result.error.issues[0]?.message ?? '入力内容を確認してください。' };
  }
  return { ok: true, data: result.data };
}

// Supabase の認証エラーをユーザー向けの日本語メッセージに変換する。
// 内部のエラー詳細は漏らさず、よくあるケースだけ親切に案内する。
export function toJapaneseAuthError(message: string | undefined): string {
  if (!message) return '認証に失敗しました。時間をおいて再度お試しください。';
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) {
    return 'メールアドレスまたはパスワードが正しくありません。';
  }
  if (m.includes('email not confirmed')) {
    return 'メールアドレスの確認が完了していません。受信メールをご確認ください。';
  }
  if (m.includes('user already registered') || m.includes('already been registered')) {
    return 'このメールアドレスは既に登録されています。ログインしてください。';
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'リクエストが多すぎます。しばらくお待ちください。';
  }
  return '認証に失敗しました。時間をおいて再度お試しください。';
}
