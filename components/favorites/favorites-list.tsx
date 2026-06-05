'use client';

import Link from 'next/link';
import { useForecast } from '@/context/forecast-context';
import { SpotRow } from '@/components/spot-row';

// お気に入り spot_id（新しい順）に対応するスポットを、予報データと突き合わせて表示する。
export default function FavoritesList({ spotIds }: { spotIds: string[] }) {
  const { allBeachesData, isLoading } = useForecast();

  // spotIds の順序（新しい順）を保ったまま、存在するスポットだけ拾う。
  const byId = new Map(allBeachesData.map((s) => [s.id, s]));
  const spots = spotIds.map((id) => byId.get(id)).filter((s): s is NonNullable<typeof s> => Boolean(s));

  if (isLoading && spots.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        {spotIds.slice(0, 3).map((id) => (
          <div key={id} className="h-[64px] rounded-xl bg-[#F5F5F5] animate-pulse" />
        ))}
      </div>
    );
  }

  if (spots.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-[#0d1b2a] font-semibold mb-2">まだお気に入りがありません</p>
        <p className="text-[#707072] text-sm mb-6">スポットの詳細画面から★で登録できます。</p>
        <Link href="/" className="btn-dark inline-flex">スポットを探す</Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#E5E5E5] flex flex-col gap-1 p-1.5 bg-[#FAFAFA]">
      {spots.map((point) => (
        <SpotRow key={point.id} point={point} />
      ))}
    </div>
  );
}
