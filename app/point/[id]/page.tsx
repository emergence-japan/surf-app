'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Cloud, Wind, Droplets, Eye, Zap, MapPin, ChevronDown, Navigation, ArrowUp, Thermometer, ArrowLeft } from 'lucide-react';
import Header from '@/components/header';
import WaveCard from '@/components/wave-card';
import ForecastChart from '@/components/forecast-chart';
import TideChart from '@/components/tide-chart';
import WeeklyForecast from '@/components/weekly-forecast';
import { convertFeetToMeters, convertWindDirection } from '@/lib/converters';
import Link from 'next/link';
import { useForecast } from '@/context/forecast-context';
import { SurfPointDetail } from '@/lib/types';

interface WaveData {
    id: string;
    beach: string;
    height: string;
    heightValue: number;
    period: number;
    windSpeed: number;
    windDirection: string;
    temperature: number;
    quality: 'S' | 'A' | 'B' | 'C' | 'D';
    time: string;
    nextUpdate: string;
}

const dirToDeg: Record<string, number> = {
    N: 0, NNE: 22.5, NE: 45, ENE: 67.5,
    E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
    S: 180, SSW: 202.5, SW: 225, WSW: 247.5,
    W: 270, WNW: 292.5, NW: 315, NNW: 337.5
};

export default function PointDetail() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const { allBeachesData, isLoading: isContextLoading } = useForecast();

    const [target, setTarget] = useState<SurfPointDetail | null>(null);
    const [currentCondition, setCurrentCondition] = useState<SurfPointDetail | null>(null);
    const [waveData, setWaveData] = useState<WaveData[]>([]);
    const [expandedCard, setExpandedCard] = useState<string | null>(null);

    useEffect(() => {
        if (!isContextLoading && allBeachesData.length > 0) {
            const foundNode = allBeachesData.find(d => d.id === id);
            if (foundNode) {
                setTarget(foundNode);
                setCurrentCondition(foundNode);
                updateWaveData(foundNode);
            }
        }
    }, [id, allBeachesData, isContextLoading]);

    const isLoading = isContextLoading;

    const updateWaveData = (target: SurfPointDetail) => {
        if (!target || !target.hourly) return;

        const now = new Date();
        const formattedHourly: WaveData[] = target.hourly
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
                temperature: target.temperature || 0,
                quality: h.quality || 'C',
                time: h.time ? new Date(h.time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '--:--',
                nextUpdate: '---'
            }));

        if (formattedHourly.length > 0) {
            setWaveData(formattedHourly);
        } else {
            const fallback: WaveData[] = target.hourly.slice(0, 4).map((h, i) => ({
                id: `${target.id}-h-${i}`,
                beach: target.beach,
                height: h.waveLabel || '-',
                heightValue: h.waveHeight || 0,
                period: h.period || 0,
                windSpeed: h.windSpeed || 0,
                windDirection: h.windDir || '-',
                temperature: target.temperature || 0,
                quality: h.quality || 'C',
                time: h.time ? new Date(h.time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '--:--',
                nextUpdate: '---'
            }));
            setWaveData(fallback);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-foreground animate-pulse">Loading point data...</p>
            </div>
        )
    }

    if (!isContextLoading && !target) {
        return (
            <div className="min-h-screen bg-background p-8">
                <Header />
                <div className="container mx-auto text-center mt-20">
                    <p className="text-xl text-foreground mb-4">Point not found</p>
                    <Link href="/" className="text-accent hover:underline">Return to Home</Link>
                </div>
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-background">
            <Header />

            <div className="container mx-auto px-4 py-8">

                {/* Back Button */}
                <div className="mb-6">
                    <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft size={20} className="mr-2" />
                        Back to List
                    </Link>
                </div>

                {/* Current Wave Status */}
                {currentCondition && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-light text-foreground mb-6 flex items-center gap-3">
                            {currentCondition.beach}
                            {currentCondition.isBestSwell && (
                                <span className="bg-teal-100 text-teal-700 text-xs font-bold px-3 py-1 rounded-full border border-teal-200 animate-pulse">
                                    MATCHING SWELL
                                </span>
                            )}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-card rounded-lg p-8 border border-border">
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <p className="text-muted-foreground text-sm mb-2">波高</p>
                                        <div className="flex items-end gap-2">
                                            <p className="text-5xl font-light text-accent">{currentCondition.height}</p>
                                            <p className="text-sm text-muted-foreground mb-2">({currentCondition.heightRange})</p>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-sm font-medium text-foreground">うねりの向き：</span>
                                            <span className="text-sm font-bold text-accent">{convertWindDirection(currentCondition.waveDirectionStr)}</span>
                                            <span className="text-xs text-muted-foreground">({currentCondition.waveDirectionStr})</span>
                                            <ArrowUp
                                                size={18}
                                                className="text-accent ml-1 inline-block"
                                                style={{ transform: `rotate(${currentCondition.waveDirectionDeg + 180}deg)` }}
                                            />
                                        </div>
                                        {currentCondition.beachFacing && (
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-sm font-medium text-foreground">ビーチの向き：</span>
                                                <span className="text-sm font-bold text-slate-600">{convertWindDirection(currentCondition.beachFacing)}</span>
                                                <span className="text-xs text-muted-foreground">({currentCondition.beachFacing})</span>
                                                <ArrowUp
                                                    size={18}
                                                    className="text-slate-400 ml-1 inline-block"
                                                    style={{ transform: `rotate(${dirToDeg[currentCondition.beachFacing] || 0}deg)` }}
                                                />
                                            </div>
                                        )}
                                        <div className="mt-3 pt-3 border-t border-border">
                                            <p className="text-xs text-muted-foreground mb-1">沖合のうねり (減衰前)</p>
                                            <div className="flex items-end gap-2">
                                                <span className="text-xl font-medium text-slate-600">{currentCondition.rawSwellHeight ? currentCondition.rawSwellHeight.toFixed(1) : '-'}m</span>
                                                <span className="text-xs text-muted-foreground mb-1">Raw Swell</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-accent">
                                        <Droplets size={32} />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground text-sm">周期</span>
                                        <span className="text-foreground font-medium">{currentCondition.period?.toFixed(1) ?? '-'}秒</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground text-sm">コンディション</span>
                                        <span className="px-3 py-1 rounded text-xs font-semibold bg-accent text-accent-foreground">
                                            {currentCondition.quality === 'S' && 'S (最高)'}
                                            {currentCondition.quality === 'A' && 'A (良い)'}
                                            {currentCondition.quality === 'B' && 'B (普通)'}
                                            {currentCondition.quality === 'C' && 'C (小波/風)'}
                                            {currentCondition.quality === 'D' && 'D (悪い)'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card rounded-lg p-8 border border-border">
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <p className="text-muted-foreground text-sm mb-2">水温</p>
                                        <p className="text-3xl font-light text-foreground">{currentCondition.temperature.toFixed(1)}°C</p>
                                    </div>
                                    <div className="text-accent">
                                        <Thermometer size={32} />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground text-sm">風速</span>
                                        <span className="text-foreground font-medium">{currentCondition.windSpeed?.toFixed(1) ?? '-'} m/s {convertWindDirection(currentCondition.windDirection)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground text-sm">次の更新</span>
                                        <span className="text-foreground font-medium">1時間後</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tide Chart */}
                <div className="mb-12">
                    <h2 className="text-2xl font-light text-foreground mb-6">タイドグラフ (潮汐) - 本日</h2>
                    <div className="bg-card rounded-lg p-8 border border-border">
                        {currentCondition && currentCondition.hourly && (
                            <TideChart
                                data={currentCondition.hourly
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

                {/* 24-Hour Forecast */}
                <div className="mb-12">
                    <h2 className="text-2xl font-light text-foreground mb-6">予報 (3時間ごと)</h2>
                    <div className="bg-card rounded-lg p-8 border border-border">
                        {waveData.length > 0 && <ForecastChart data={waveData} />}
                    </div>
                </div>

                {/* Weekly Forecast */}
                <div className="mb-12">
                    {currentCondition && currentCondition.daily && (
                        <WeeklyForecast data={currentCondition.daily} />
                    )}
                </div>

                {/* Hourly Forecast Cards */}
                <div className="mb-12">
                    <h2 className="text-2xl font-light text-foreground mb-6">詳細予報</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            </div >
        </main >
    );
}
