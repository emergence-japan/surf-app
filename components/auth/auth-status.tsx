'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { signOut } from '@/app/login/actions';

// ヘッダーのドロップダウン内に表示するログイン状態。
// ログアウト時は「ログイン」リンク、ログイン時はメールと「ログアウト」を表示。
export default function AuthStatus({ onNavigate }: { onNavigate?: () => void }) {
  const [email, setEmail] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setResolved(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
      setResolved(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // 初回解決まではちらつき防止のため何も出さない
  if (!resolved) return <div className="h-9" aria-hidden />;

  if (!email) {
    const next = pathname && pathname !== '/login' ? `?next=${encodeURIComponent(pathname)}` : '';
    return (
      <Link
        href={`/login${next}`}
        onClick={onNavigate}
        className="text-[13px] font-semibold text-[#06b6d4] hover:text-[#0891b2] px-2 py-2 rounded-lg hover:bg-[#F5F5F5] transition-colors"
      >
        ログイン
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-1 border-t border-[#E5E5E5] pt-2 mt-1">
      <span className="text-[11px] text-[#9E9EA0] px-2 truncate">{email}</span>
      {/* ログアウトは Server Action でセッション Cookie を消す。
          onClick でメニューを閉じるとフォームが unmount され送信がキャンセルされるため、
          ここでは onNavigate を付けない（signOut が / にリダイレクトする）。 */}
      <form action={signOut}>
        <button
          type="submit"
          className="w-full text-left text-[13px] font-medium text-[#707072] hover:text-rose-500 px-2 py-2 rounded-lg hover:bg-[#F5F5F5] transition-colors"
        >
          ログアウト
        </button>
      </form>
    </div>
  );
}
