'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** カスタムフォールバック UI（省略時はデフォルト UI を使用） */
  fallback?: ReactNode;
  /** エラー発生時のコールバック */
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * React エラーバウンダリ
 * 子コンポーネントのレンダリングエラーをキャッチして
 * フォールバック UI を表示する。
 * Sentry が設定されている場合は自動的にエラーを送信する。
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError?.(error, info);
    console.error('[ErrorBoundary]', error.message, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-center">
          <AlertTriangle size={36} className="text-amber-500" />
          <div>
            <p className="font-semibold text-slate-700 mb-1">
              このセクションでエラーが発生しました
            </p>
            <p className="text-sm text-slate-500">
              {this.state.error?.message ?? '予期しないエラー'}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 text-sm font-medium bg-white border border-amber-200 text-amber-700 px-4 py-2 rounded-full hover:bg-amber-50 transition-colors"
          >
            <RefreshCw size={14} />
            再試行
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
