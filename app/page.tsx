'use client';

import { useMemo, useState } from "react"
import { Search, Activity, AlertTriangle, RefreshCw } from 'lucide-react'
import Header from "@/components/header"
import { RegionGroup } from "@/components/region-group"
import { useForecast } from "@/context/forecast-context"
import { groupByRegion } from "@/lib/regions"

export default function Home() {
  const { allBeachesData, isLoading, isError, errorMessage, refreshData } = useForecast();
  const [searchQuery, setSearchQuery] = useState("");

  const regionGroups = useMemo(() => {
    const filtered = searchQuery
      ? allBeachesData.filter(p => p.beach.toLowerCase().includes(searchQuery.toLowerCase()))
      : allBeachesData;
    return groupByRegion(filtered);
  }, [allBeachesData, searchQuery]);

  const totalSpots = regionGroups.reduce((sum, g) => sum + g.points.length, 0);
  const isSearching = searchQuery.length > 0;

  return (
    <main className="min-h-screen bg-white">

      {/* ── Hero ── full-bleed, no border radius */}
      <section className="relative w-full" style={{ height: 'clamp(480px, 70vw, 720px)' }}>
        <img
          src="https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&q=85&w=2000"
          alt="Perfect Wave"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-white" />

        <Header />

        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 pb-16 text-center">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-white/80 mb-4 flex items-center gap-2">
            <Activity size={12} className="text-cyan-300" />
            Ocean Intelligence Feed
          </p>
          <h1
            className="text-white leading-none uppercase"
            style={{
              fontFamily: "'Barlow Condensed', Helvetica, Arial, sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(52px, 10vw, 96px)',
              lineHeight: 0.9,
              letterSpacing: '-0.01em',
            }}
          >
            FIND YOUR<br />
            <span className="text-cyan-300">PERFECT WAVE</span>
          </h1>
          <p className="mt-5 text-white/80 text-base font-medium max-w-md leading-relaxed">
            独自の気象アルゴリズムが解析する、次世代の波予測。
          </p>

          {/* Search */}
          <div className="relative w-full max-w-lg mt-8">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#707072] pointer-events-none" />
            <input
              type="text"
              placeholder="サーフスポットを検索..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* ── Region List ── */}
      <section className="max-w-2xl mx-auto px-4 md:px-6 py-10">

        {/* Section header */}
        <div className="flex items-baseline justify-between mb-5 border-b border-[#E5E5E5] pb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#707072] mb-0.5">
              Now Casting
            </p>
            <p className="text-2xl font-semibold text-[#0d1b2a]" style={{ fontFamily: "'Inter', sans-serif" }}>
              今日の波情報
            </p>
          </div>
          <span className="text-xs font-medium text-[#707072]">
            {totalSpots} スポット
          </span>
        </div>

        {/* States */}
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-14 rounded-xl bg-[#F5F5F5] animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="bg-[#F5F5F5] p-4 rounded-full">
              <AlertTriangle size={36} className="text-[#D30005]" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[#0d1b2a]">データの取得に失敗しました</p>
              <p className="text-sm text-[#707072] mt-1">{errorMessage ?? '波情報を読み込めませんでした'}</p>
            </div>
            <button onClick={refreshData} className="btn-dark flex items-center gap-2">
              <RefreshCw size={14} />
              再試行
            </button>
          </div>
        ) : regionGroups.length === 0 ? (
          <p className="text-center text-[#9E9EA0] py-16">スポットが見つかりませんでした</p>
        ) : (
          <div className="flex flex-col gap-2">
            {regionGroups.map(group => (
              <RegionGroup
                key={group.region}
                group={group}
                defaultOpen={isSearching}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
