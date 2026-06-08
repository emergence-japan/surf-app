'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Lock, Star } from 'lucide-react';
import { shouldLockSpot, FREE_FAVORITE_LIMIT } from '@/lib/plan/limits';
import type { FavoriteState } from '@/hooks/use-favorite-state';

// 無料ユーザーが「お気に入りに入れていないスポット」の詳細を開いたとき、
// 予報データをぼかして上に課金/お気に入り導線をかぶせる。
//
// 課金モデル: お気に入りに入れたスポットだけ詳細が見れる。
// → ★お気に入りに追加すればこの場でロックが解ける。
//
// 注: isPremium は現状クライアントでは常に false（課金基盤が未実装）。
// データ自体はクライアントに届くため、これはUX上の蓋。サーバーでの厳格な秘匿はフェーズD。
export default function LockedOverlay({
  spotId,
  fav,
  children,
}: {
  spotId: string;
  fav: FavoriteState;
  children: ReactNode;
}) {
  // 認証解決前は中身をぼかして待つ（解決後に確定 → ちらつき・データ一瞬見えを防ぐ）
  const locked = !fav.resolved || shouldLockSpot({ isPremium: false, isFavorited: fav.favorited });

  if (!locked) return <>{children}</>;

  return (
    <div className="relative">
      {/* ぼかした予報（操作不可・支援技術からも隠す） */}
      <div className="pointer-events-none select-none blur-[6px] opacity-60" aria-hidden>
        {children}
      </div>

      {/* 課金/お気に入り導線のオーバーレイ */}
      <div className="absolute inset-0 z-10 flex items-start justify-center pt-10 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl border border-[#E5E5E5] p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#0d1b2a]">
            <Lock size={20} className="text-white" />
          </div>
          <p className="text-[16px] font-bold text-[#0d1b2a] mb-1">このスポットの予報はロック中</p>
          <p className="text-[13px] leading-relaxed text-[#707072] mb-5">
            お気に入りに追加すると、このスポットの詳細予報が見られます。
            <br />
            無料プランは<span className="font-semibold text-[#0d1b2a]">{FREE_FAVORITE_LIMIT}つ</span>まで登録できます。
          </p>

          {fav.userId ? (
            <>
              <button
                type="button"
                onClick={fav.toggle}
                disabled={fav.isPending}
                className="btn-dark inline-flex w-full items-center justify-center gap-2 disabled:opacity-60"
              >
                <Star size={16} />
                お気に入りに追加して見る
              </button>
              {fav.limitReached && (
                <p role="status" className="mt-3 text-[12px] leading-snug text-rose-500">
                  お気に入りが{FREE_FAVORITE_LIMIT}つに達しています。別のスポットを外すと追加できます。
                  <br />
                  <span className="text-[#06b6d4] font-medium">まもなく無制限プランを提供予定です。</span>
                </p>
              )}
            </>
          ) : (
            <Link
              href={`/login?next=/point/${spotId}`}
              className="btn-dark inline-flex w-full items-center justify-center gap-2"
            >
              ログインして見る
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
