'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import type { FavoriteState } from '@/hooks/use-favorite-state';
import { FREE_FAVORITE_LIMIT } from '@/lib/plan/limits';

// スポット詳細のヒーローに置く★ボタン。
// お気に入り状態は親（詳細ページ）が useFavoriteState で解決して渡す。
// 未ログイン: ログイン画面へのリンク（元スポットに戻る）。
// ログイン中: お気に入りのトグル（楽観的UI）。無料プランの上限超過はサーバーが拒否し、案内を出す。
export default function FavoriteButton({ spotId, fav }: { spotId: string; fav: FavoriteState }) {
  const { resolved, userId, favorited, isPending, limitReached, clearLimitReached, toggle } = fav;

  // 上限案内は数秒で自動的に消す
  useEffect(() => {
    if (!limitReached) return;
    const t = setTimeout(clearLimitReached, 5000);
    return () => clearTimeout(t);
  }, [limitReached, clearLimitReached]);

  const baseClass =
    'inline-flex items-center justify-center w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/20 transition-all duration-150 active:scale-95';

  // 解決前: レイアウトシフト防止のプレースホルダ
  if (!resolved) return <div className="w-10 h-10" aria-hidden />;

  // 未ログイン: ログインへ誘導
  if (!userId) {
    return (
      <Link
        href={`/login?next=/point/${spotId}`}
        aria-label="お気に入りに追加（ログインが必要）"
        className={`${baseClass} text-white hover:bg-black/50`}
      >
        <Star size={18} />
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        aria-pressed={favorited}
        aria-label={favorited ? 'お気に入りから外す' : 'お気に入りに追加'}
        className={`${baseClass} disabled:opacity-70 ${favorited ? 'text-[#06b6d4]' : 'text-white hover:bg-black/50'}`}
      >
        <Star size={18} fill={favorited ? '#06b6d4' : 'none'} />
      </button>

      {/* 上限到達の案内（ボタン下に吹き出し） */}
      {limitReached && (
        <div
          role="status"
          className="absolute right-0 top-12 z-20 w-60 rounded-xl bg-white shadow-lg border border-[#E5E5E5] p-3 text-left animate-in fade-in slide-in-from-top-1 duration-200"
        >
          {/* 吹き出しの三角 */}
          <span className="absolute -top-1.5 right-3 w-3 h-3 rotate-45 bg-white border-l border-t border-[#E5E5E5]" />
          <p className="text-[13px] font-semibold text-[#0d1b2a] mb-1">
            お気に入りは{FREE_FAVORITE_LIMIT}つまで
          </p>
          <p className="text-[12px] leading-snug text-[#707072]">
            無料プランの上限です。別のスポットを外すと追加できます。
            <br />
            <span className="text-[#06b6d4] font-medium">まもなく無制限プランを提供予定です。</span>
          </p>
        </div>
      )}
    </div>
  );
}
