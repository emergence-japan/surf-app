'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Next.js App Router のルートレベルエラーページ
 * ページコンポーネントで未処理のエラーが発生した場合に表示される。
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Route Error]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F9FF] px-6">
      <div className="text-center space-y-6 max-w-md w-full">
        <div className="flex justify-center">
          <div className="bg-amber-100 p-5 rounded-full">
            <AlertTriangle size={48} className="text-amber-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">
            エラーが発生しました
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            予期しないエラーが発生しました。しばらくしてから再度お試しください。
          </p>
          {error.digest && (
            <p className="text-[11px] text-slate-400 font-mono">
              エラーID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
          >
            <RefreshCw size={16} />
            再試行
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-6 py-3 rounded-full font-medium hover:bg-slate-50 transition-all"
          >
            <Home size={16} />
            トップへ
          </Link>
        </div>
      </div>
    </div>
  );
}
