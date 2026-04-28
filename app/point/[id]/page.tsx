'use client';

import { useMemo, useCallback, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Wind, ArrowUp, ArrowLeft, Waves, Thermometer, Clock, Timer, Cloud, Compass } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/header';
import TideChart from '@/components/tide-chart';
import ForecastChart from '@/components/forecast-chart';
import WeeklyForecast from '@/components/weekly-forecast';
import { convertWindDirection } from '@/lib/converters';
import { useForecast } from '@/context/forecast-context';
import type { SurfPointDetail, QualityLevel } from '@/lib/types';

const qualityConfig: Record<string, { label: string; badge: string; badgeBg: string; barFrom: string; barTo: string }> = {
  S: { label: 'EPIC',  badge: 'text-amber-600',  badgeBg: 'bg-amber-50 border border-amber-200',  barFrom: 'from-amber-400', barTo: 'to-orange-500' },
  A: { label: 'GREAT', badge: 'text-cyan-700',   badgeBg: 'bg-cyan-50 border border-cyan-200',    barFrom: 'from-cyan-500',  barTo: 'to-sky-400' },
  B: { label: 'GOOD',  badge: 'text-emerald-700', badgeBg: 'bg-emerald-50 border border-emerald-200', barFrom: 'from-emerald-500', barTo: 'to-teal-400' },
  C: { label: 'FAIR',  badge: 'text-slate-600',  badgeBg: 'bg-slate-100 border border-slate-200', barFrom: 'from-slate-400', barTo: 'to-slate-500' },
  D: { label: 'POOR',  badge: 'text-slate-500',  badgeBg: 'bg-slate-50 border border-slate-200',  barFrom: 'from-slate-300', barTo: 'to-slate-400' },
};

const dirToDeg: Record<string, number> = {
  N:0,NNE:22.5,NE:45,ENE:67.5,E:90,ESE:112.5,SE:135,SSE:157.5,
  S:180,SSW:202.5,SW:225,WSW:247.5,W:270,WNW:292.5,NW:315,NNW:337.5
};

function StatRow({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#E5E5E5] last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-[#9E9EA0]">{icon}</span>
        <span className="text-[12px] font-medium text-[#707072] uppercase tracking-[0.1em]">{label}</span>
      </div>
      <div className="text-right">
        <span className="text-[14px] font-semibold text-[#0d1b2a]">{value}</span>
        {sub && <span className="text-[12px] text-[#9E9EA0] ml-1.5">{sub}</span>}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#707072]">{children}</p>
      <div className="flex-1 h-px bg-[#E5E5E5]" />
    </div>
  );
}

function CompassCard({ label, dir, deg, color }: { label: string; dir: string; deg: number; color: string }) {
  return (
    <div className="rounded-xl border border-[#E5E5E5] p-4 flex items-center justify-between">
      <div>
        <p className="text-[11px] text-[#9E9EA0] font-medium mb-1 whitespace-nowrap">{label}</p>
        <p className="text-[15px] font-semibold text-[#0d1b2a]">{convertWindDirection(dir)}</p>
      </div>
      {/* Compass circle with SVG grid lines */}
      <div className="relative w-11 h-11">
        <svg viewBox="0 0 44 44" className="absolute inset-0 w-full h-full">
          <circle cx="22" cy="22" r="20" fill="#F5F5F5" stroke="#E5E5E5" strokeWidth="1" />
          <line x1="22" y1="4" x2="22" y2="40" stroke="#E5E5E5" strokeWidth="0.8" />
          <line x1="4" y1="22" x2="40" y2="22" stroke="#E5E5E5" strokeWidth="0.8" />
          <circle cx="22" cy="22" r="1.5" fill="#CACACB" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <ArrowUp size={16} className={color} style={{ transform: `rotate(${deg}deg)` }} />
        </div>
      </div>
    </div>
  );
}

interface WaveCardData {
  id: string; beach: string; height: string; heightValue: number;
  period: number; windSpeed: number; windDirection: string;
  quality: QualityLevel; time: string; temperature: number;
}

export default function PointDetail() {
  const params = useParams();
  const id = params?.id as string;
  const { allBeachesData, isLoading, lastUpdated } = useForecast();
  const [target, setTarget] = useState<SurfPointDetail | null>(null);
  const [waveData, setWaveData] = useState<WaveCardData[]>([]);

  const buildWaveData = useCallback((point: SurfPointDetail): WaveCardData[] => {
    if (!point.hourly) return [];
    const now = new Date();
    const future = point.hourly.filter(h => h?.time && new Date(h.time) >= now);
    const source = future.length >= 4 ? future : point.hourly;
    return source
      .filter((_, i) => i % 3 === 0)
      .slice(0, 8)
      .map((h, i) => ({
        id: `${point.id}-h-${i}`,
        beach: point.beach,
        height: h.waveLabel || '-',
        heightValue: h.waveHeight || 0,
        period: h.period || 0,
        windSpeed: h.windSpeed || 0,
        windDirection: h.windDir || '-',
        quality: h.quality || 'C',
        time: h.time ? new Date(h.time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '--:--',
        temperature: point.temperature ?? 0,
      }));
  }, []);

  useEffect(() => {
    if (!isLoading && allBeachesData.length > 0) {
      const found = allBeachesData.find(d => d.id === id);
      if (found) { setTarget(found); setWaveData(buildWaveData(found)); }
    }
  }, [id, allBeachesData, isLoading, buildWaveData]);

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdated) return '-';
    const diffMin = Math.floor((Date.now() - lastUpdated.getTime()) / 60000);
    if (diffMin < 1) return 'たった今';
    if (diffMin < 60) return `${diffMin}分前`;
    return `${Math.floor(diffMin / 60)}時間前`;
  }, [lastUpdated]);

  const windLabel = useMemo(() => {
    if (!target) return '';
    const DIRS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    const bi = DIRS.indexOf(target.beachFacing), wi = DIRS.indexOf(target.windDirection);
    if (bi === -1 || wi === -1) return '—';
    let diff = Math.abs(bi - wi); if (diff > 8) diff = 16 - diff;
    const spd = target.windSpeed ?? 0;
    if (diff >= 6) return spd > 5 ? '強いオフショア' : 'オフショア';
    if (diff <= 2) return spd > 4 ? '強いオンショア' : 'オンショア';
    return 'サイドウィンド';
  }, [target]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#E5E5E5] border-t-[#06b6d4] animate-spin" />
      </div>
    );
  }

  if (!target) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-lg mx-auto text-center py-24 px-6">
          <p className="text-[#0d1b2a] font-semibold text-lg mb-2">スポットが見つかりません</p>
          <p className="text-[#707072] text-sm mb-8">お探しのスポットは登録されていません。</p>
          <Link href="/" className="btn-dark inline-flex items-center gap-2">
            <ArrowLeft size={14} /> 一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  const cfg = qualityConfig[target.quality] ?? qualityConfig['D'];
  const [prefecture, ...spotParts] = target.beach.split(/\s+/);
  const spotName = spotParts.join(' ') || target.beach;

  return (
    <main className="min-h-screen bg-white pb-20">
      <Header />

      {/* ── Hero banner with photo ── */}
      <div className="relative w-full overflow-hidden" style={{ height: 'clamp(180px, 40vw, 260px)' }}>
        <img
          src="https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&q=80&w=1200"
          alt={spotName}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1b2a]/80 via-[#0d1b2a]/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-4 md:px-6 pb-5 max-w-2xl mx-auto">
          <p className="text-[11px] text-white/60 font-medium mb-1">{prefecture}</p>
          <div className="flex items-end justify-between gap-3">
            <h1
              className="text-white leading-none uppercase"
              style={{
                fontFamily: "'Barlow Condensed', Helvetica, Arial, sans-serif",
                fontWeight: 700,
                fontSize: 'clamp(32px, 8vw, 52px)',
                lineHeight: 0.92,
              }}
            >
              {spotName}
            </h1>
            <span className={`shrink-0 mb-1 text-[11px] font-bold tracking-[0.1em] uppercase px-3 py-1.5 rounded-full ${cfg.badge} ${cfg.badgeBg}`}>
              {target.quality} · {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[11px] text-white/50 flex items-center gap-1">
              <Clock size={10} />
              {lastUpdatedLabel}更新
            </span>
            {target.isBestSwell && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-900/40 border border-amber-500/30 px-2 py-0.5 rounded-full">
                ★ BEST SWELL
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">

        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#9E9EA0] hover:text-[#06b6d4] transition-colors mb-6">
          <ArrowLeft size={14} />
          一覧に戻る
        </Link>

        {/* ── Primary stats ── */}
        <div className="rounded-xl border border-[#E5E5E5] overflow-hidden mb-4">
          <div className="px-4 py-3 bg-[#FAFAFA] border-b border-[#E5E5E5]">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#707072]">現在のコンディション</p>
          </div>

          {/* Wave height hero */}
          <div className="px-4 py-5 border-b border-[#E5E5E5]">
            {/* Big number */}
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-[11px] text-[#9E9EA0] font-medium uppercase tracking-widest mb-1">波のサイズ</p>
                <div className="flex items-baseline gap-2">
                  <p
                    className={`leading-none bg-gradient-to-b ${cfg.barFrom} ${cfg.barTo} bg-clip-text text-transparent`}
                    style={{
                      fontFamily: "'Barlow Condensed', Helvetica, Arial, sans-serif",
                      fontWeight: 700,
                      fontSize: 'clamp(52px, 14vw, 72px)',
                      lineHeight: 1,
                    }}
                  >
                    {target.heightMeters?.toFixed(1) ?? '—'}
                  </p>
                  <span className="text-[18px] font-semibold text-[#9E9EA0] mb-1">m</span>
                </div>
                <p
                  className="text-[#0d1b2a] mt-1"
                  style={{ fontFamily: "'Barlow Condensed', Helvetica, Arial, sans-serif", fontWeight: 700, fontSize: 22 }}
                >
                  {target.height}
                </p>
              </div>

              {/* Wave meter */}
              <div className="flex items-end gap-1 h-14">
                {[0.3, 0.6, 1.0, 1.5, 2.0, 2.5, 3.0].map((threshold, i) => {
                  const filled = (target.heightMeters ?? 0) >= threshold;
                  return (
                    <div
                      key={i}
                      className={`w-2.5 rounded-sm ${filled ? `bg-gradient-to-t ${cfg.barFrom} ${cfg.barTo}` : 'bg-[#E5E5E5]'}`}
                      style={{ height: `${30 + i * 10}%` }}
                    />
                  );
                })}
              </div>
            </div>

            {/* 2-col info grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: <Timer size={12} />, label: '周期', value: `${target.period?.toFixed(1) ?? '—'} 秒` },
                { icon: <Compass size={12} />, label: 'うねりの向き', value: convertWindDirection(target.waveDirectionStr) },
                { icon: <Waves size={12} />, label: '沖合うねり', value: `${target.rawSwellHeight?.toFixed(1) ?? '—'} m` },
                { icon: <Wind size={12} />, label: '風の状態', value: windLabel },
              ].map(({ icon, label, value }) => (
                <div key={label} className="bg-[#FAFAFA] rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1 text-[#9E9EA0]">
                    {icon}
                    <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
                  </div>
                  <p className="text-[13px] font-semibold text-[#0d1b2a]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Wind & Environment ── */}
        <div className="rounded-xl border border-[#E5E5E5] overflow-hidden mb-4">
          <div className="px-4 py-3 bg-[#FAFAFA] border-b border-[#E5E5E5]">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#707072]">風・環境</p>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2">
            {[
              { icon: <Wind size={12} />, label: '風速', value: `${target.windSpeed?.toFixed(1) ?? '—'} m/s`, sub: convertWindDirection(target.windDirection) },
              { icon: <Wind size={12} />, label: '風の状態', value: windLabel },
              { icon: <Compass size={12} />, label: '岸の向き', value: convertWindDirection(target.beachFacing || 'N') },
              { icon: <Thermometer size={12} />, label: '水温', value: `${target.temperature?.toFixed(1) ?? '—'}°C` },
              { icon: <Cloud size={12} />, label: '雲量', value: target.cloudCover != null ? `${target.cloudCover}%` : '—' },
            ].map(({ icon, label, value, sub }) => (
              <div key={label} className="bg-[#FAFAFA] rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-1 text-[#9E9EA0]">
                  {icon}
                  <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
                </div>
                <p className="text-[13px] font-semibold text-[#0d1b2a]">
                  {value}{sub && <span className="text-[11px] font-normal text-[#9E9EA0] ml-1">{sub}</span>}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Direction compass row ── */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <CompassCard
            label="うねりの向き"
            dir={target.waveDirectionStr}
            deg={target.waveDirectionDeg + 180}
            color="text-[#06b6d4]"
          />
          <CompassCard
            label="岸の向き"
            dir={target.beachFacing || 'N'}
            deg={dirToDeg[target.beachFacing || 'N'] ?? 0}
            color="text-[#9E9EA0]"
          />
        </div>

        {/* ── Tide chart ── */}
        <SectionTitle>タイドグラフ（24時間）</SectionTitle>
        <div className="rounded-xl border border-[#E5E5E5] p-4 mb-8 h-[200px]">
          {target.hourly && (
            <TideChart
              data={target.hourly.slice(0, 24).map(h => ({
                time: new Date(h.time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false }),
                height: h.tide || 0,
              }))}
            />
          )}
        </div>

        {/* ── Hourly forecast chart ── */}
        <SectionTitle>時間別の波予報</SectionTitle>
        <div className="rounded-xl border border-[#E5E5E5] p-4 mb-8 h-[200px]">
          {waveData.length > 0 && <ForecastChart data={waveData} />}
        </div>

        {/* ── Hourly list ── */}
        <SectionTitle>時間別データ</SectionTitle>
        <div className="rounded-xl border border-[#E5E5E5] overflow-hidden mb-8">
          {waveData.map((wave, i) => {
            const wcfg = qualityConfig[wave.quality] ?? qualityConfig['D'];
            return (
              <div key={wave.id} className={`flex items-center gap-3 px-4 py-3 ${i !== waveData.length - 1 ? 'border-b border-[#E5E5E5]' : ''}`}>
                <span className="text-[12px] font-semibold text-[#707072] w-10 shrink-0">{wave.time}</span>
                <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${wcfg.badge} ${wcfg.badgeBg}`}>
                  {wave.quality}
                </span>
                <span className="flex-1 text-[14px] font-semibold text-[#0d1b2a]">{wave.height}</span>
                <div className="flex items-center gap-1 text-[#9E9EA0]">
                  <Waves size={11} />
                  <span className="text-[11px]">{wave.period.toFixed(0)}s</span>
                </div>
                <div className="flex items-center gap-1 text-[#9E9EA0]">
                  <Wind size={11} />
                  <span className="text-[11px]">{wave.windSpeed.toFixed(1)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Weekly forecast ── */}
        <SectionTitle>週間予報</SectionTitle>
        {target.daily && <WeeklyForecast data={target.daily} />}

      </div>
    </main>
  );
}
