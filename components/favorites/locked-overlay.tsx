'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Lock, Eye } from 'lucide-react';
import { FREE_DAILY_VIEW_LIMIT } from '@/lib/plan/daily-meter';
import type { DailyViewMeter } from '@/hooks/use-daily-view-meter';

// 無料ユーザーの「1日3スポット」閲覧メーターに応じて、スポット詳細の表示を制御する。
//
// 課金モデル: 無料は1日3スポットまで詳細を閲覧できる（日付が変わるとリセット）。
//   - 表示OK（有料 or 当日解放済み） → 中身をそのまま見せる
//   - 枠が残っている             → ぼかし＋「このスポットを見る（残りN枠）」
//   - 枠切れ                     → ぼかし＋「今日の無料閲覧は使い切り」課金導線
//
// 注: データ自体はクライアントに届くため、これはUX上の蓋。サーバーでの厳格な
// 秘匿は課金基盤(フェーズD)で扱う。
export default function LockedOverlay({
  spotId,
  meter,
  children,
}: {
  spotId: string;
  meter: DailyViewMeter;
  children: ReactNode;
}) {
  // 解決前は中身をぼかして待つ（解決後に確定 → ちらつき・データ一瞬見えを防ぐ）
  if (meter.resolved && meter.viewable) return <>{children}</>;

  const limitReached = meter.resolved && meter.limitReached;

  return (
    <div className="relative">
      {/* ぼかした予報（操作不可・支援技術からも隠す） */}
      <div className="pointer-events-none select-none blur-[6px] opacity-60" aria-hidden>
        {children}
      </div>

      {/* 解決前はオーバーレイを出さない（ちらつき防止） */}
      {meter.resolved && (
        <div className="absolute inset-0 z-10 flex items-start justify-center pt-10 px-4">
          {limitReached ? <LimitWall spotId={spotId} /> : <UnlockCard meter={meter} />}
        </div>
      )}
    </div>
  );
}

// 枠が残っているとき: その場で枠を消費して閲覧を開始する。
function UnlockCard({ meter }: { meter: DailyViewMeter }) {
  const remaining = meter.remaining ?? FREE_DAILY_VIEW_LIMIT;
  return (
    <div className="w-full max-w-sm rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl border border-[#E5E5E5] p-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#0d1b2a]">
        <Eye size={20} className="text-white" />
      </div>
      <p className="text-[16px] font-bold text-[#0d1b2a] mb-1">このスポットの詳細予報を見る</p>
      <p className="text-[13px] leading-relaxed text-[#707072] mb-5">
        無料プランは1日<span className="font-semibold text-[#0d1b2a]">{FREE_DAILY_VIEW_LIMIT}スポット</span>まで詳細を見られます。
      </p>
      <button
        type="button"
        onClick={meter.unlock}
        className="btn-dark inline-flex w-full items-center justify-center gap-2"
      >
        <Eye size={16} />
        見る（今日はあと{remaining}スポット）
      </button>
    </div>
  );
}

// 当日の枠切れ: 課金導線（無制限プラン）を出す。
function LimitWall({ spotId }: { spotId: string }) {
  return (
    <div className="w-full max-w-sm rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl border border-[#E5E5E5] p-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#0d1b2a]">
        <Lock size={20} className="text-white" />
      </div>
      <p className="text-[16px] font-bold text-[#0d1b2a] mb-1">今日の無料閲覧は使い切りました</p>
      <p className="text-[13px] leading-relaxed text-[#707072] mb-5">
        無料プランは1日{FREE_DAILY_VIEW_LIMIT}スポットまでです。
        日付が変わるとまた{FREE_DAILY_VIEW_LIMIT}スポット見られます。
        <br />
        <span className="text-[#06b6d4] font-medium">まもなく無制限プランを提供予定です。</span>
      </p>
      <Link
        href={`/login?next=/point/${spotId}`}
        className="btn-dark inline-flex w-full items-center justify-center gap-2"
      >
        ログイン / 登録する
      </Link>
    </div>
  );
}
