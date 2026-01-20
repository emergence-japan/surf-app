'use client';

import { useState, useEffect } from 'react';
import { Cloud, Wind, Droplets, Eye, Zap, MapPin, ChevronDown, Navigation, ArrowUp } from 'lucide-react';
import Header from '@/components/header';
import WaveCard from '@/components/wave-card';
import ForecastChart from '@/components/forecast-chart';
import BeachSelector from '@/components/beach-selector';
import DetailPanel from '@/components/detail-panel';
import { convertFeetToMeters, convertWindDirection } from '@/lib/converters';

interface WaveData {
  id: string;
  beach: string;
  height: string;
  period: number;
  windSpeed: number;
  windDirection: string;
  temperature: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  time: string;
  nextUpdate: string;
}

// APIのレスポンス型
interface ApiPointData extends WaveData {
  heightMeters: number;
  heightRange: string;
  waveDirectionStr: string; 
  waveDirectionDeg: number; 
  isBestSwell: boolean;
  beachFacing: string; // 追加
  visibility?: number;
  cloudCover?: number;   
  hourly: {
    time: string;
    waveHeight: number;
    waveLabel: string;
    waveRange: string;
    period: number;
    windSpeed: number;
    windDir: string;
    quality: 'excellent' | 'good' | 'fair' | 'poor';
  }[];
}

const dirToDeg: Record<string, number> = {
  N: 0, NNE: 22.5, NE: 45, ENE: 67.5,
  E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
  S: 180, SSW: 202.5, SW: 225, WSW: 247.5,
  W: 270, WNW: 292.5, NW: 315, NNW: 337.5
};

export default function Home() {
  const [selectedBeach, setSelectedBeach] = useState('');
  const [allBeachesData, setAllBeachesData] = useState<ApiPointData[]>([]);
  const [waveData, setWaveData] = useState<WaveData[]>([]); // 選択されたビーチの時間予報(チャート用)
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/forecast');
        const data: ApiPointData[] = await res.json();
        setAllBeachesData(data);
        if (data.length > 0 && !selectedBeach) {
          setSelectedBeach(data[0].beach);
        } else if (selectedBeach) {
           // 既存の選択があればデータを更新
           updateWaveData(selectedBeach, data);
        }
      } catch (error) {
        console.error('Failed to fetch forecast:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // 選択変更時にデータを整形して更新
  useEffect(() => {
    if (selectedBeach && allBeachesData.length > 0) {
      updateWaveData(selectedBeach, allBeachesData);
    }
  }, [selectedBeach, allBeachesData]);

  const updateWaveData = (beachName: string, allData: ApiPointData[]) => {
    const target = allData.find(d => d.beach === beachName);
    if (!target) return;

    // HourlyデータをWaveData形式に変換 (直近4〜5個を抽出したり、重要な時間帯を抽出)
    // ここではAPIから返ってきたhourlyをそのまま使う（ただし数が多すぎるとUI崩れるかもなので調整）
    const now = new Date();
    
    // 表示用に「現在」「3時間後」「6時間後」「9時間後」などをピックアップ
    const formattedHourly: WaveData[] = target.hourly
      .filter((h) => new Date(h.time) >= now) // 未来のみ
      .filter((_, i) => i % 3 === 0) // 3時間おき
      .slice(0, 4) // 4つだけ
      .map((h, i) => ({
        id: `${target.id}-h-${i}`,
        beach: target.beach,
        height: h.waveRange, // チャート用の範囲文字列 (例: 0.9-1.2m)
        period: h.period,
        windSpeed: h.windSpeed,
        windDirection: h.windDir,
        temperature: target.temperature,
        quality: h.quality,
        time: new Date(h.time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        nextUpdate: '---'
      }));
    
    // もし未来データがなければ（夜遅くなど）、そのまま全部出すか調整
    // ここでは単純に代入
    if (formattedHourly.length > 0) {
        setWaveData(formattedHourly);
    } else {
        // フォールバック: 直近のデータそのまま
         const fallback: WaveData[] = target.hourly.slice(0,4).map((h, i) => ({
            id: `${target.id}-h-${i}`,
            beach: target.beach,
            height: h.waveRange,
            period: h.period,
            windSpeed: h.windSpeed,
            windDirection: h.windDir,
            temperature: target.temperature,
            quality: h.quality,
            time: new Date(h.time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
            nextUpdate: '---'
        }));
        setWaveData(fallback);
    }
  };
  
  // 現在のコンディション（選択されたビーチの最新状態）
  // waveData[0] だと「直近の3時間後」になってしまう可能性があるので、
  // allBeachesDataから直接現在のデータを取る
  const currentCondition = allBeachesData.find(d => d.beach === selectedBeach);

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Beach Selector */}
        <div className="mb-12">
          <BeachSelector 
            selectedBeach={selectedBeach} 
            onSelectBeach={setSelectedBeach} 
            beaches={allBeachesData.map(d => d.beach)}
          />
        </div>

        {/* Current Wave Status */}
        {!isLoading && currentCondition && (
          <div className="mb-12">
            <h2 className="text-2xl font-light text-foreground mb-6 flex items-center gap-3">
              現在の波況 ({currentCondition.beach})
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
                  </div>
                  <div className="text-accent">
                    <Droplets size={32} />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">周期</span>
                    <span className="text-foreground font-medium">{currentCondition.period.toFixed(1)}秒</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">コンディション</span>
                    <span className="px-3 py-1 rounded text-xs font-semibold bg-accent text-accent-foreground">
                      {currentCondition.quality === 'excellent' && '最高'}
                      {currentCondition.quality === 'good' && '良い'}
                      {currentCondition.quality === 'fair' && '普通'}
                      {currentCondition.quality === 'poor' && '悪い'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg p-8 border border-border">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">気象条件</p>
                    <p className="text-3xl font-light text-foreground">{currentCondition.temperature}°C</p>
                  </div>
                  <div className="text-accent">
                    <Cloud size={32} />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">風速</span>
                    <span className="text-foreground font-medium">{currentCondition.windSpeed.toFixed(1)} m/s {convertWindDirection(currentCondition.windDirection)}</span>
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

        {/* 24-Hour Forecast */}
        <div className="mb-12">
          <h2 className="text-2xl font-light text-foreground mb-6">予報 (3時間ごと)</h2>
          <div className="bg-card rounded-lg p-8 border border-border">
            {waveData.length > 0 && <ForecastChart data={waveData} />}
          </div>
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

        {/* Additional Info */}
        <div className="mb-12">
          <h2 className="text-2xl font-light text-foreground mb-6">詳細情報</h2>
          {waveData.length > 0 && <DetailPanel data={waveData[0]} />}
        </div>
      </div>
    </main>
  );
}
