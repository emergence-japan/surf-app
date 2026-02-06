'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Cloud, Wind, Droplets, MapPin, ArrowUp, Thermometer, ArrowLeft, Waves, Clock, Info, ShieldCheck } from 'lucide-react';
import Header from '@/components/header';
import WaveCard from '@/components/wave-card';
import ForecastChart from '@/components/forecast-chart';
import TideChart from '@/components/tide-chart';
import WeeklyForecast from '@/components/weekly-forecast';
import { convertWindDirection } from '@/lib/converters';
import Link from 'next/link';
import { useForecast } from '@/context/forecast-context';
import { SurfPointDetail } from '@/lib/types';

const dirToDeg: Record<string, number> = {
    N: 0, NNE: 22.5, NE: 45, ENE: 67.5,
    E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
    S: 180, SSW: 202.5, SW: 225, WSW: 247.5,
    W: 270, WNW: 292.5, NW: 315, NNW: 337.5
};

export default function PointDetail() {
    const params = useParams();
    const id = params?.id as string;
    const { allBeachesData, isLoading: isContextLoading } = useForecast();

    const [target, setTarget] = useState<SurfPointDetail | null>(null);
    const [waveData, setWaveData] = useState<any[]>([]);
    const [expandedCard, setExpandedCard] = useState<string | null>(null);

    useEffect(() => {
        if (!isContextLoading && allBeachesData.length > 0) {
            const foundNode = allBeachesData.find(d => d.id === id);
            if (foundNode) {
                setTarget(foundNode);
                updateWaveData(foundNode);
            }
        }
    }, [id, allBeachesData, isContextLoading]);

    const updateWaveData = (target: SurfPointDetail) => {
        if (!target || !target.hourly) return;
        const now = new Date();
        const formattedHourly = target.hourly
            .filter((h) => h && h.time && new Date(h.time) >= now)
            .filter((_, i) => i % 3 === 0)
            .slice(0, 4)
            .map((h, i) => ({
                id: `${target.id}-h-${i}`,
                beach: target.beach,
                height: h.waveLabel || '-',
                heightValue: h.waveHeight || 0,
                period: h.period || 0,
                windSpeed: h.windSpeed || 0,
                windDirection: h.windDir || '-',
                quality: h.quality || 'C',
                time: h.time ? new Date(h.time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '--:--',
            }));
        setWaveData(formattedHourly);
    };

    if (isContextLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin mb-4" />
                <p className="text-muted-foreground font-light tracking-widest uppercase text-xs">データ取得中...</p>
            </div>
        )
    }

    if (!target) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="container mx-auto text-center py-20 px-6">
                    <h2 className="text-3xl font-light mb-4">スポットが見つかりません</h2>
                    <p className="text-muted-foreground mb-8">お探しのサーフスポットはデータベースに登録されていないか、移動された可能性があります。</p>
                    <Link href="/" className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20">
                        <ArrowLeft size={18} />
                        一覧に戻る
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <main className="min-h-screen relative overflow-hidden pb-20">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 -z-10 w-[1000px] h-[1000px] bg-blue-400/5 blur-[150px] rounded-full" />
            <div className="absolute bottom-0 left-0 -z-10 w-[800px] h-[800px] bg-cyan-400/5 blur-[120px] rounded-full" />

            <Header />

            <div className="container mx-auto px-6 py-8">
                {/* Back Button */}
                <div className="mb-10">
                    <Link href="/" className="group inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-blue-500 transition-colors">
                        <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                        一覧に戻る
                    </Link>
                </div>

                {/* Hero Info */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500/10 text-blue-600 p-2 rounded-xl">
                                <MapPin size={24} />
                            </div>
                            <h1 className="text-4xl md:text-6xl font-light tracking-tight text-foreground leading-none">
                                {target.beach}
                            </h1>
                        </div>
                        <p className="text-muted-foreground text-lg font-light flex items-center gap-2">
                            日本 沿岸エリア <span className="w-1 h-1 rounded-full bg-border" /> 
                            <span className="flex items-center gap-1 text-blue-500">
                                <ShieldCheck size={16} /> 公認スポット
                            </span>
                        </p>
                    </div>

                    <div className="flex gap-3">
                        {target.isBestSwell && (
                            <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-5 py-2.5 rounded-2xl text-xs font-bold tracking-widest uppercase shadow-lg shadow-blue-500/20 animate-pulse">
                                <Waves size={16} />
                                最高のコンディション
                            </div>
                        )}
                        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md border border-blue-100 px-5 py-2.5 rounded-2xl text-xs font-bold tracking-widest uppercase text-blue-600">
                            <Clock size={16} />
                            最終更新: 12分前
                        </div>
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    
                    {/* Primary Wave Card */}
                    <div className="lg:col-span-2 glass-card rounded-[2.5rem] p-10 relative overflow-hidden border-white/40">
                        <div className="absolute top-0 right-0 p-10 opacity-5">
                            <Waves size={200} />
                        </div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-10">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500">主要なうねり</p>
                                    <h2 className="text-2xl font-semibold">コンディション概要</h2>
                                </div>
                                <div className={`px-5 py-2 rounded-2xl text-sm font-black tracking-widest uppercase
                                    ${target.quality === 'S' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' :
                                    target.quality === 'A' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' :
                                    target.quality === 'B' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' :
                                    target.quality === 'C' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-slate-500 text-white'}`}>
                                    評価: {target.quality}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <div>
                                        <p className="text-muted-foreground text-sm font-medium mb-3">波のサイズ</p>
                                        <div className="flex items-baseline gap-3">
                                            <p className="text-7xl font-extralight text-foreground tracking-tighter leading-none">{target.height}</p>
                                            <p className="text-xl text-muted-foreground font-light">{target.heightRange}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">周期</p>
                                            <p className="text-3xl font-light text-foreground">{target.period?.toFixed(1) ?? '-'} <span className="text-sm">秒</span></p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">沖合のうねり</p>
                                            <p className="text-3xl font-light text-foreground">{target.rawSwellHeight?.toFixed(1) ?? '-'} <span className="text-sm">m</span></p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8 bg-blue-50/50 rounded-[2rem] p-8 border border-blue-100/50">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">うねりの向き</p>
                                            <p className="text-lg font-semibold">{convertWindDirection(target.waveDirectionStr)}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                            <ArrowUp size={24} className="text-blue-500 transition-transform duration-1000" style={{ transform: `rotate(${target.waveDirectionDeg + 180}deg)` }} />
                                        </div>
                                    </div>
                                    
                                    <div className="h-px bg-blue-100" />
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">岸の向き</p>
                                            <p className="text-lg font-semibold">{convertWindDirection(target.beachFacing || "N")}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                            <ArrowUp size={24} className="text-slate-400" style={{ transform: `rotate(${dirToDeg[target.beachFacing || "N"] || 0}deg)` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Wind & Environment Card */}
                    <div className="glass-card rounded-[2.5rem] p-10 flex flex-col border-white/40">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="bg-amber-500/10 text-amber-600 p-2.5 rounded-xl">
                                <Wind size={20} />
                            </div>
                            <h3 className="text-xl font-semibold">周辺環境</h3>
                        </div>

                        <div className="flex-1 space-y-10">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-muted-foreground text-sm font-medium">風の状態</p>
                                    <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase">弱いオフショア</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-6xl font-extralight text-foreground tracking-tighter leading-none">{target.windSpeed?.toFixed(1) ?? '-'}</p>
                                    <p className="text-lg text-muted-foreground font-light tracking-tight">m/s {convertWindDirection(target.windDirection)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50 space-y-2">
                                    <div className="text-blue-500"><Thermometer size={20} /></div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">水温</p>
                                    <p className="text-2xl font-semibold leading-none">{target.temperature.toFixed(1)}°C</p>
                                </div>
                                <div className="p-6 bg-cyan-50/50 rounded-3xl border border-cyan-100/50 space-y-2">
                                    <div className="text-cyan-500"><Droplets size={20} /></div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">湿度</p>
                                    <p className="text-2xl font-semibold leading-none">64%</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-10 p-5 bg-white/50 rounded-2xl border border-blue-50 text-[11px] text-muted-foreground leading-relaxed flex gap-3">
                            <Info size={16} className="shrink-0 text-blue-400" />
                            <p>現在の風向きは、このポイントの波の面を整えるのに適したオフショアです。</p>
                        </div>
                    </div>
                </div>

                {/* Tide & Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    <div className="glass-card rounded-[2.5rem] p-10 border-white/40">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-semibold tracking-tight">タイドグラフ (潮汐)</h3>
                            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-secondary px-3 py-1 rounded-full">24時間予測</div>
                        </div>
                        <div className="h-[300px]">
                            {target.hourly && (
                                <TideChart
                                    data={target.hourly
                                        .filter((h, index) => index < 24)
                                        .map(h => ({
                                            time: new Date(h.time).toLocaleTimeString('ja-JP', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: false
                                            }),
                                            height: h.tide || 0
                                        }))
                                    }
                                />
                            )}
                        </div>
                    </div>

                    <div className="glass-card rounded-[2.5rem] p-10 border-white/40">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-semibold tracking-tight">時間別の波予報</h3>
                            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-secondary px-3 py-1 rounded-full">3時間間隔</div>
                        </div>
                        <div className="h-[300px]">
                            {waveData.length > 0 && <ForecastChart data={waveData} />}
                        </div>
                    </div>
                </div>

                {/* Extended Forecasts */}
                <div className="space-y-12">
                    <div className="flex flex-col gap-8">
                        {target.daily && <WeeklyForecast data={target.daily} />}
                    </div>

                    <div className="space-y-8">
                        <div className="flex items-center gap-3 px-2">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">時間別の詳細データ</h3>
                            <div className="h-px flex-1 bg-blue-100" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {waveData.map((wave) => (
                                <WaveCard
                                    key={wave.id}
                                    wave={wave}
                                    isExpanded={expandedCard === wave.id}
                                    onExpand={() => setExpandedCard(expandedCard === wave.id ? null : wave.id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div >
        </main >
    );
}
