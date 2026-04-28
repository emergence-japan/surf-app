'use client';

import { ArrowUp, Wind, Waves } from 'lucide-react';
import { convertWindDirection } from '@/lib/converters';
import { WeatherIcon } from '@/components/weather-icon';

interface DailyData {
  time: string;
  waveHeight: number;
  rawWaveHeight: number;
  waveLabel: string;
  windSpeedMax: number;
  windDir: string;
  temperatureMax: number;
  temperatureMin: number;
  weatherCode: number;
  quality: 'S' | 'A' | 'B' | 'C' | 'D';
}

interface WeeklyForecastProps {
  data: DailyData[];
}

const qualityConfig: Record<string, { badge: string; barFrom: string; barTo: string; label: string }> = {
  S: { label: 'EPIC',  badge: 'bg-amber-500 text-white',    barFrom: 'from-amber-400', barTo: 'to-orange-500' },
  A: { label: 'GREAT', badge: 'bg-cyan-500 text-white',     barFrom: 'from-cyan-500',  barTo: 'to-sky-400' },
  B: { label: 'GOOD',  badge: 'bg-emerald-500 text-white',  barFrom: 'from-emerald-500', barTo: 'to-teal-400' },
  C: { label: 'FAIR',  badge: 'bg-slate-200 text-slate-600', barFrom: 'from-slate-400', barTo: 'to-slate-500' },
  D: { label: 'POOR',  badge: 'bg-slate-100 text-slate-500', barFrom: 'from-slate-300', barTo: 'to-slate-400' },
};

const dirToDeg: Record<string, number> = {
  N: 0, NNE: 22.5, NE: 45, ENE: 67.5,
  E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
  S: 180, SSW: 202.5, SW: 225, WSW: 247.5,
  W: 270, WNW: 292.5, NW: 315, NNW: 337.5,
};

const DAYS = ['日', '月', '火', '水', '木', '金', '土'];

export default function WeeklyForecast({ data }: WeeklyForecastProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#E5E5E5] overflow-hidden">
      {data.map((day, i) => {
        const d = new Date(day.time);
        const dateLabel = `${d.getMonth() + 1}/${d.getDate()}`;
        const dayLabel = DAYS[d.getDay()];
        const cfg = qualityConfig[day.quality] ?? qualityConfig['D'];

        return (
          <div
            key={i}
            className={`grid grid-cols-[56px_1fr_auto] items-center gap-2 px-4 py-3 ${i !== data.length - 1 ? 'border-b border-[#E5E5E5]' : ''}`}
          >
            {/* Left: date + weather */}
            <div className="flex flex-col">
              <p className="text-[10px] font-bold text-[#06b6d4] uppercase tracking-wide leading-none">{dayLabel}曜日</p>
              <p className="text-[13px] font-semibold text-[#0d1b2a] mt-0.5">{dateLabel}</p>
              <div className="mt-1"><WeatherIcon code={day.weatherCode} size={14} /></div>
            </div>

            {/* Center: quality + wave label */}
            <div className="flex items-center gap-2 min-w-0">
              <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${cfg.badge}`}>
                {day.quality}
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-[#0d1b2a] leading-snug">{day.waveLabel}</p>
                <div className="flex items-center gap-1">
                  <Waves size={9} className="text-[#9E9EA0]" />
                  <span className="text-[10px] text-[#9E9EA0]">{day.rawWaveHeight.toFixed(1)}m</span>
                </div>
              </div>
            </div>

            {/* Right: wind */}
            <div className="flex items-center gap-1 shrink-0">
              <div className="text-right">
                <p className="text-[12px] font-semibold text-[#0d1b2a] leading-none whitespace-nowrap">
                  {day.windSpeedMax.toFixed(1)}<span className="text-[9px] font-normal text-[#9E9EA0]">m/s</span>
                </p>
                <p className="text-[10px] text-[#9E9EA0] mt-0.5 whitespace-nowrap">{convertWindDirection(day.windDir)}</p>
              </div>
              <div className="w-6 h-6 rounded-full bg-[#F5F5F5] flex items-center justify-center">
                <ArrowUp size={11} className="text-[#9E9EA0]" style={{ transform: `rotate(${dirToDeg[day.windDir] ?? 0}deg)` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
