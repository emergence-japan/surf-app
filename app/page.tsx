'use client';

import { useState } from "react"
import Link from "next/link"
import { Wind, MapPin, Search, Activity, ArrowUp, AlertTriangle, RefreshCw, Waves } from 'lucide-react'
import Header from "@/components/header"
import { useForecast } from "@/context/forecast-context"
import { convertWindDirection } from "@/lib/converters"

const qualityConfig: Record<string, {
  label: string;
  gradientFrom: string;
  gradientTo: string;
  badge: string;
  border: string;
  glow: string;
}> = {
  'S': {
    label: 'EPIC',
    gradientFrom: 'from-amber-400',
    gradientTo: 'to-orange-500',
    badge: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white',
    border: 'border-amber-300',
    glow: 'shadow-amber-200',
  },
  'A': {
    label: 'GREAT',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-cyan-400',
    badge: 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white',
    border: 'border-blue-300',
    glow: 'shadow-blue-100',
  },
  'B': {
    label: 'GOOD',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-teal-400',
    badge: 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white',
    border: 'border-emerald-300',
    glow: 'shadow-emerald-100',
  },
  'C': {
    label: 'FAIR',
    gradientFrom: 'from-slate-400',
    gradientTo: 'to-slate-500',
    badge: 'bg-gradient-to-r from-slate-400 to-slate-500 text-white',
    border: 'border-slate-200',
    glow: 'shadow-slate-100',
  },
  'D': {
    label: 'POOR',
    gradientFrom: 'from-slate-300',
    gradientTo: 'to-slate-400',
    badge: 'bg-gradient-to-r from-slate-300 to-slate-400 text-white',
    border: 'border-slate-200',
    glow: 'shadow-slate-100',
  },
};

const qualityOrder: Record<string, number> = { S: 0, A: 1, B: 2, C: 3, D: 4 };

export default function Home() {
  const { allBeachesData, isLoading, isError, errorMessage, refreshData } = useForecast();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPoints = allBeachesData
    .filter(point => point.beach.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const qDiff = (qualityOrder[a.quality] ?? 5) - (qualityOrder[b.quality] ?? 5);
      if (qDiff !== 0) return qDiff;
      return (b.heightMeters || 0) - (a.heightMeters || 0);
    });

  return (
    <main className="min-h-screen relative bg-[#F0F9FF] overflow-x-hidden">

      {/* Ocean Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-400/20 via-white to-[#E0F2FE]" />
        <div className="absolute top-[20%] left-[-10%] w-[120vw] h-[60vh] bg-blue-400/5 rounded-[100%] rotate-[-5deg] blur-3xl animate-pulse" />
        <div className="absolute top-[40%] right-[-10%] w-[120vw] h-[50vh] bg-cyan-400/5 rounded-[100%] rotate-[3deg] blur-3xl" />
        <div className="absolute inset-0 ocean-wave-pattern" />
      </div>

      {/* Hero Section */}
      <section className="relative h-[85vh] min-h-[650px] flex flex-col overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&q=85&w=2000"
            alt="Perfect Wave"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/10 to-[#F0F9FF]" />
        </div>

        <Header />

        <div className="container mx-auto px-6 flex-1 flex flex-col items-center justify-center text-center relative z-10">
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-white text-[10px] font-black tracking-[0.4em] uppercase shadow-2xl ring-1 ring-white/30">
              <Activity size={14} className="animate-pulse text-cyan-300" />
              Ocean Intelligence Feed
            </div>

            <h1 className="text-7xl md:text-9xl font-black text-white tracking-tighter leading-[0.85] italic drop-shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
              FIND YOUR <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-100">
                PERFECT WAVE
              </span>
            </h1>

            <p className="text-white/90 text-xl max-w-2xl font-medium leading-relaxed drop-shadow-md">
              独自の気象アルゴリズムが解析する、次世代の波予測。
              <br className="hidden md:block" /> あなただけのベストウェーブを逃さない。
            </p>

            {/* Search */}
            <div className="w-full max-w-2xl mx-auto mt-12 group">
              <div className="relative flex items-center p-1.5 bg-white/20 backdrop-blur-3xl border border-white/30 rounded-full shadow-2xl transition-all duration-500 focus-within:bg-white focus-within:ring-8 focus-within:ring-white/10">
                <div className="pl-8 text-white/70 group-focus-within:text-slate-400 transition-colors">
                  <Search size={22} />
                </div>
                <input
                  type="text"
                  placeholder="サーフスポットを検索..."
                  className="w-full bg-transparent border-none outline-none text-white group-focus-within:text-slate-900 placeholder:text-white/60 group-focus-within:placeholder:text-slate-400 py-5 px-6 font-semibold text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="bg-blue-600 text-white px-10 py-5 rounded-full font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 active:scale-95">
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Card Grid Section */}
      <section className="container mx-auto px-4 md:px-6 py-16 relative z-10 max-w-6xl">

        {/* Section Header */}
        <div className="flex items-center justify-between mb-10 px-1">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-1">Now Casting</p>
            <p className="text-xl font-bold text-slate-800 tracking-tight">今日の波情報</p>
          </div>
          <p className="text-[11px] font-medium text-slate-400">{filteredPoints.length} スポット</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-52 bg-white/60 rounded-3xl animate-pulse border border-white shadow-sm" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
            <div className="bg-amber-100 p-5 rounded-full">
              <AlertTriangle size={40} className="text-amber-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-700 mb-1">データの取得に失敗しました</p>
              <p className="text-slate-500 text-sm">{errorMessage ?? '波情報を読み込めませんでした'}</p>
            </div>
            <button
              onClick={refreshData}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
            >
              <RefreshCw size={16} />
              再試行
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPoints.map((point) => {
              const [prefecture, ...spotParts] = point.beach.split(/\s+/);
              const spotName = spotParts.join(' ') || point.beach;
              const cfg = qualityConfig[point.quality] ?? qualityConfig['D'];

              return (
                <Link key={point.id} href={`/point/${point.id}`}>
                  <div className={`group relative bg-white rounded-3xl border ${cfg.border} shadow-lg ${cfg.glow} hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer`}>

                    {/* Top color bar */}
                    <div className={`h-1.5 w-full bg-gradient-to-r ${cfg.gradientFrom} ${cfg.gradientTo}`} />

                    <div className="p-5">

                      {/* Header: Quality badge + Best Swell */}
                      <div className="flex items-center justify-between mb-4">
                        <span className={`text-[11px] font-black tracking-widest px-3 py-1 rounded-full ${cfg.badge}`}>
                          {point.quality} · {cfg.label}
                        </span>
                        {point.isBestSwell && (
                          <span className="text-[10px] font-bold text-amber-500 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            ★ BEST
                          </span>
                        )}
                      </div>

                      {/* Spot name */}
                      <div className="mb-4">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <MapPin size={11} className="text-slate-400 shrink-0" />
                          <span className="text-[11px] text-slate-400 font-medium">{prefecture}</span>
                        </div>
                        <p className="text-[19px] font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
                          {spotName}
                        </p>
                      </div>

                      {/* Wave height — hero stat */}
                      <div className="flex items-end justify-between mb-4">
                        <div>
                          <p className="text-[11px] text-slate-400 font-medium mb-0.5">波のサイズ</p>
                          <p className="text-2xl font-black text-slate-800 leading-none">{point.height}</p>
                          <p className="text-[12px] text-slate-500 mt-1">{point.heightMeters?.toFixed(1) ?? '—'} m</p>
                        </div>

                        {/* Wave height bar */}
                        <div className="flex items-end gap-0.5 h-10">
                          {[0.2, 0.4, 0.6, 0.8, 1.0].map((threshold, i) => {
                            const filled = (point.heightMeters ?? 0) > threshold;
                            return (
                              <div
                                key={i}
                                className={`w-2.5 rounded-sm transition-all duration-500 ${filled
                                  ? `bg-gradient-to-t ${cfg.gradientFrom} ${cfg.gradientTo} opacity-90`
                                  : 'bg-slate-100'
                                  }`}
                                style={{ height: `${(i + 1) * 20}%` }}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Stats row */}
                      <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Waves size={12} className="text-slate-400" />
                          <span className="text-[12px] font-semibold">{point.period?.toFixed(0) ?? '—'}s</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Wind size={12} className="text-slate-400" />
                          <span className="text-[12px] font-semibold">{point.windSpeed?.toFixed(1) ?? '—'} m/s</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 ml-auto">
                          <ArrowUp
                            size={12}
                            className="text-slate-400 shrink-0"
                            style={{ transform: `rotate(${(point.waveDirectionDeg ?? 0) + 180}deg)` }}
                          />
                          <span className="text-[12px] font-semibold">{convertWindDirection(point.waveDirectionStr)}</span>
                        </div>
                      </div>

                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  )
}
