'use client';

import { useState } from "react"
import Link from "next/link"
import { Wind, MapPin, Search, Activity, Waves, Timer, Navigation, Zap } from 'lucide-react'
import Header from "@/components/header"
import { useForecast } from "@/context/forecast-context"
import { convertWindDirection } from "@/lib/converters"
import VisualWaveHeight from "@/components/visual-wave-height"

const qualityConfig: Record<string, { style: string }> = {
  'S': { style: 'bg-indigo-50 border-indigo-200 text-indigo-600' },
  'A': { style: 'bg-blue-50 border-blue-200 text-blue-600' },
  'B': { style: 'bg-emerald-50 border-emerald-200 text-emerald-600' },
  'C': { style: 'bg-amber-50 border-amber-200 text-amber-600' },
  'D': { style: 'bg-slate-50 border-slate-200 text-slate-600' },
};

export default function Home() {
  const { allBeachesData, isLoading } = useForecast();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPoints = allBeachesData.filter(point =>
    point.beach.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => (b.heightMeters || 0) - (a.heightMeters || 0));

  return (
    <main className="min-h-screen relative bg-[#F0F9FF] overflow-x-hidden">

      {/* Ocean Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-400/20 via-white to-[#E0F2FE]" />
        <div className="absolute top-[20%] left-[-10%] w-[120vw] h-[60vh] bg-blue-400/5 rounded-[100%] rotate-[-5deg] blur-3xl animate-pulse" />
        <div className="absolute top-[40%] right-[-10%] w-[120vw] h-[50vh] bg-cyan-400/5 rounded-[100%] rotate-[3deg] blur-3xl" />
        <div className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 13 50 13s16.36 2.347 25.96 5.937l1.768.662c.368.138.73.272 1.088.401H100V0H0v20h21.184z' fill='%230ea5e9' fill-rule='evenodd'/%3E%3C/svg%3E")`, backgroundSize: '400px 80px' }}
        />
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

      {/* Cards Section */}
      <section className="container mx-auto px-6 py-20 relative z-10">
        <div className="flex items-end justify-between mb-12 px-4 border-b border-blue-100 pb-8">
          <div className="space-y-1">
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-blue-600">Coastal Precision</h2>
            <p className="text-4xl font-bold text-slate-900 tracking-tight">Active Surf Breaks</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold text-blue-600 bg-white shadow-sm px-5 py-2.5 rounded-full border border-blue-50">
            <Waves size={14} className="text-blue-400 animate-bounce" />
            {filteredPoints.length} STATIONS TRACKING
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-72 bg-white/50 rounded-[2.5rem] animate-pulse border border-white" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPoints.map((point) => {
              // ビーチ名から都道府県とスポット名を分割（例: "福井 鳥居浜" → ["福井", "鳥居浜"]）
              const [prefecture, ...spotParts] = point.beach.split(/\s+/);
              const spotName = spotParts.join(' ') || point.beach;
              const qStyle = qualityConfig[point.quality]?.style ?? 'bg-slate-50 border-slate-200 text-slate-600';

              return (
                <Link key={point.id} href={`/point/${point.id}`} className="group block">
                  <div className="relative h-full flex flex-col rounded-[2.5rem] p-7 transition-all duration-700
                    bg-white/50 backdrop-blur-3xl backdrop-saturate-150
                    border border-white/80 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.07)]
                    hover:-translate-y-3 hover:shadow-[0_40px_80px_-20px_rgba(30,58,138,0.15)]
                    hover:bg-white/75 overflow-hidden">

                    {/* 光沢エフェクト */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none" />

                    {/* ヘッダー */}
                    <div className="flex justify-between items-start mb-5 relative z-10">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5 text-blue-500">
                          <MapPin size={11} />
                          <span className="text-[10px] font-bold tracking-[0.18em] uppercase">{prefecture}</span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight group-hover:text-blue-600 transition-colors duration-300">
                          {spotName}
                        </h3>
                      </div>

                      {/* グレードバッジ + BEST */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0 ml-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black border shadow-sm ${qStyle}`}>
                          {point.quality}
                        </div>
                        {point.isBestSwell && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-full text-amber-600">
                            <Zap size={9} />
                            <span className="text-[9px] font-black tracking-wider">BEST</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 波高 + ビジュアル */}
                    <div className="flex items-center justify-between mb-5 relative z-10">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Wave Height</p>
                        <span className="text-4xl font-black text-slate-900 tracking-tighter">
                          {point.height}
                        </span>
                      </div>
                      <VisualWaveHeight
                        heightMeters={point.heightMeters || 0}
                        className="w-20 h-20 relative z-10 drop-shadow-lg"
                      />
                    </div>

                    {/* コンディション解説 */}
                    <p className="text-[11px] leading-relaxed text-slate-500 mb-5 relative z-10">
                      {point.conditionSummary}
                    </p>

                    {/* 統計グリッド（3列） */}
                    <div className="grid grid-cols-3 gap-3 pt-5 border-t border-blue-100/60 relative z-10">

                      {/* 周期 */}
                      <div>
                        <div className="flex items-center gap-1.5 text-slate-400 mb-1.5">
                          <Timer size={11} />
                          <span className="text-[9px] font-bold uppercase tracking-[0.15em]">周期</span>
                        </div>
                        <p className="text-xl font-light text-slate-800 tracking-tight">
                          {point.period?.toFixed(0) ?? '-'}
                          <span className="text-[10px] font-bold text-slate-400 ml-1">sec</span>
                        </p>
                      </div>

                      {/* 風 */}
                      <div>
                        <div className="flex items-center gap-1.5 text-slate-400 mb-1.5">
                          <Wind size={11} />
                          <span className="text-[9px] font-bold uppercase tracking-[0.15em]">風</span>
                        </div>
                        <p className="text-xl font-light text-slate-800 tracking-tight">
                          {point.windSpeed?.toFixed(1) ?? '-'}
                          <span className="text-[10px] font-bold text-slate-400 ml-1">m/s</span>
                        </p>
                        <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wider mt-0.5">
                          {convertWindDirection(point.windDirection)}
                        </p>
                      </div>

                      {/* うねり方向 */}
                      <div>
                        <div className="flex items-center gap-1.5 text-slate-400 mb-1.5">
                          <Navigation size={11} />
                          <span className="text-[9px] font-bold uppercase tracking-[0.15em]">うねり</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Navigation
                            size={18}
                            className="text-blue-500 shrink-0"
                            style={{ transform: `rotate(${point.waveDirectionDeg}deg)` }}
                          />
                          <p className="text-[11px] font-bold text-slate-700 leading-tight">
                            {convertWindDirection(point.waveDirectionStr)}
                          </p>
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
