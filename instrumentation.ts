/**
 * Next.js Instrumentation Hook
 * サーバー起動時に Sentry を初期化する。
 * SENTRY_DSN 環境変数が未設定の場合は Sentry を無効化（ローカル開発等）。
 */

export async function register() {
  if (!process.env.SENTRY_DSN) return;

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const Sentry = await import('@sentry/nextjs');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      // 本番では tracesSampleRate を下げてコストを削減（例: 0.1 = 10%）
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      environment: process.env.NODE_ENV,
      // 開発中はデバッグ情報を表示
      debug: process.env.NODE_ENV === 'development',
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    const Sentry = await import('@sentry/nextjs');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      environment: process.env.NODE_ENV,
    });
  }
}

// Next.js 15+ のリクエストエラーフック（未処理のサーバーエラーを Sentry に送信）
export { onRequestError } from '@sentry/nextjs';
