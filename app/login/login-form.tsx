'use client';

import { useState, useActionState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { signInWithPassword, signUpWithPassword, type AuthActionResult } from './actions';

const initialState: AuthActionResult = {};

export default function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const action = mode === 'login' ? signInWithPassword : signUpWithPassword;
  const [state, formAction, pending] = useActionState(action, initialState);

  async function handleGoogle() {
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* モード切替タブ */}
      <div className="flex rounded-full bg-[#F0F0F0] p-1 text-[13px] font-semibold">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`flex-1 rounded-full py-2 transition-colors ${mode === 'login' ? 'bg-white text-[#0d1b2a] shadow-sm' : 'text-[#9E9EA0]'}`}
        >
          ログイン
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`flex-1 rounded-full py-2 transition-colors ${mode === 'signup' ? 'bg-white text-[#0d1b2a] shadow-sm' : 'text-[#9E9EA0]'}`}
        >
          新規登録
        </button>
      </div>

      {/* Google ログイン */}
      <button
        type="button"
        onClick={handleGoogle}
        className="flex items-center justify-center gap-2 w-full rounded-full border border-[#E5E5E5] py-3 text-[14px] font-medium text-[#0d1b2a] hover:bg-[#FAFAFA] transition-colors"
      >
        <GoogleIcon />
        Googleで{mode === 'login' ? 'ログイン' : '登録'}
      </button>

      <div className="flex items-center gap-3 text-[11px] text-[#9E9EA0]">
        <div className="flex-1 h-px bg-[#E5E5E5]" />
        または
        <div className="flex-1 h-px bg-[#E5E5E5]" />
      </div>

      {/* メール・パスワード */}
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="next" value={next} />
        <div>
          <label className="block text-[11px] font-medium text-[#707072] mb-1.5 uppercase tracking-wider">メールアドレス</label>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-xl border border-[#E5E5E5] bg-white px-4 py-3 text-[15px] text-[#0d1b2a] outline-none focus:border-[#06b6d4] transition-colors"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-[#707072] mb-1.5 uppercase tracking-wider">パスワード</label>
          <input
            name="password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={6}
            className="w-full rounded-xl border border-[#E5E5E5] bg-white px-4 py-3 text-[15px] text-[#0d1b2a] outline-none focus:border-[#06b6d4] transition-colors"
            placeholder="6文字以上"
          />
        </div>

        {state.error && (
          <p className="text-[13px] text-rose-500 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="btn-primary w-full justify-center disabled:opacity-60 mt-1"
        >
          {pending ? '処理中…' : mode === 'login' ? 'ログイン' : '登録する'}
        </button>
      </form>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  );
}
