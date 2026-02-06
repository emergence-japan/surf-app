'use client';

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Wind, MapPin, Search, Activity, Droplets, ArrowUpRight, Waves } from 'lucide-react'
import Header from "@/components/header"
import { useForecast } from "@/context/forecast-context"
import { convertWindDirection } from "@/lib/converters"
import VisualWaveHeight from "@/components/visual-wave-height"

export default function Home() {
  const { allBeachesData, isLoading } = useForecast();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPoints = allBeachesData.filter(point => 
    point.beach.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => (b.heightMeters || 0) - (a.heightMeters || 0));

  return (
    <main className="min-h-screen relative bg-[#F0F9FF] overflow-x-hidden">
      
      {/* 
          Vibrant Ocean Background 
          - Abstract waves and light rays
      */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-400/20 via-white to-[#E0F2FE]" />
        
        {/* Abstract Wave Shapes */}
        <div className="absolute top-[20%] left-[-10%] w-[120vw] h-[60vh] bg-blue-400/5 rounded-[100%] rotate-[-5deg] blur-3xl animate-pulse" />
        <div className="absolute top-[40%] right-[-10%] w-[120vw] h-[50vh] bg-cyan-400/5 rounded-[100%] rotate-[3deg] blur-3xl" />
        
        {/* Subtle Wave Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.05]" 
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 13 50 13s16.36 2.347 25.96 5.937l1.768.662c.368.138.73.272 1.088.401H100V0H0v20h21.184z' fill='%230ea5e9' fill-rule='evenodd'/%3E%3C/svg%3E")`, backgroundSize: '400px 80px' }} 
        />
      </div>

      {/* Hero Section */}
      <section className="relative h-[85vh] min-h-[650px] flex flex-col overflow-hidden">
        {/* Background Image with brighter overlay */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&q=85&w=2000" 
            alt="Perfect Wave"
            className="w-full h-full object-cover"
          />
          {/* Brighter, clearer overlay */}
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

            {/* Premium Crystal Search */}
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

      {/* Grid Section - Bright Coastal Look */}
      <section className="container mx-auto px-6 py-24 relative z-10">
        <div className="flex items-end justify-between mb-16 px-4 border-b border-blue-100 pb-8">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 bg-white/50 rounded-[3rem] animate-pulse border border-white" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredPoints.map((point) => (
              <Link key={point.id} href={`/point/${point.id}`} className="group block">
                {/* 
                   Brighter Crystal Glass Design:
                   - High transparency with blue tint (bg-white/40)
                   - Intense backdrop blur
                   - Sharp white borders
                */}
                <div className="relative h-full flex flex-col rounded-[3rem] p-10 transition-all duration-700 
                  bg-white/40 backdrop-blur-3xl backdrop-saturate-150 
                  border border-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)]
                  hover:-translate-y-4 hover:shadow-[0_40px_100px_-20px_rgba(30,58,138,0.15)]
                  hover:bg-white/70 overflow-hidden">
                  
                  {/* Glossy Light Streak */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none" />

                  {/* Header */}
                  <div className="flex justify-between items-start mb-12 relative z-10">
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-blue-600 font-black">
                        <MapPin size={14} />
                        <span className="text-[10px] tracking-[0.2em] uppercase">Regional Break</span>
                      </div>
                      <h3 className="text-3xl font-bold text-slate-900 tracking-tighter leading-tight group-hover:text-blue-600 transition-colors">
                        {point.beach}
                      </h3>
                    </div>
                    
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm backdrop-blur-md
                      ${point.quality === 'S' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' :
                        point.quality === 'A' ? 'bg-blue-50 border-blue-200 text-blue-600' :
                        point.quality === 'B' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                        point.quality === 'C' ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}>
                      {point.quality} Grade
                    </div>
                  </div>

                  {/* Wave Height */}
                  <div className="flex-1 flex flex-col justify-center mb-12 relative z-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Current Height</p>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-5xl font-black text-slate-900 tracking-tighter whitespace-nowrap overflow-hidden text-ellipsis">
                        {point.height}
                      </span>
                      <div className="relative shrink-0">
                         <div className="absolute inset-0 bg-blue-400/10 blur-2xl rounded-full scale-150 group-hover:bg-blue-400/30 transition-colors" />
                         <VisualWaveHeight heightMeters={point.heightMeters || 0} className="w-24 h-24 relative z-10 drop-shadow-xl brightness-90" />
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-8 pt-8 border-t border-blue-100/50 relative z-10">
                    <div>
                       <div className="flex items-center gap-2 text-slate-400 mb-2">
                         <Droplets size={14} />
                         <span className="text-[10px] font-black uppercase tracking-[0.2em]">Period</span>
                       </div>
                       <p className="text-2xl font-light text-slate-800 tracking-tight">{point.period?.toFixed(1) ?? '-'} <span className="text-xs font-bold text-slate-400 uppercase ml-1">sec</span></p>
                    </div>
                    <div>
                       <div className="flex items-center gap-2 text-slate-400 mb-2">
                         <Wind size={14} />
                         <span className="text-[10px] font-black uppercase tracking-[0.2em]">Wind</span>
                       </div>
                       <div className="flex flex-col">
                         <p className="text-2xl font-light text-slate-800 tracking-tight">{point.windSpeed?.toFixed(1) ?? '-'} <span className="text-xs font-bold text-slate-400 uppercase ml-1">m/s</span></p>
                         <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">{convertWindDirection(point.windDirection)}</p>
                       </div>
                    </div>
                  </div>

                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}