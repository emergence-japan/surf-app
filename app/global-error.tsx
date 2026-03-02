'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Next.js App Router のルートレイアウトレベルのエラーページ
 * RootLayout 自体でエラーが発生した場合に表示される。
 * このコンポーネントは <html> / <body> を自分で提供する必要がある。
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global Error]', error);
  }, [error]);

  return (
    <html lang="ja">
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#F0F9FF' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
              致命的なエラーが発生しました
            </h2>
            <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px' }}>
              アプリケーションの初期化中にエラーが発生しました。
              ページを再読み込みしてください。
            </p>
            <button
              onClick={reset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              再読み込み
            </button>
            {error.digest && (
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '16px', fontFamily: 'monospace' }}>
                エラーID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
