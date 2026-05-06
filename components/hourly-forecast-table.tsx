'use client';

import { ArrowUp } from 'lucide-react';
import { convertWindDirection } from '@/lib/converters';
import { WeatherIcon } from '@/components/weather-icon';
import type { HourlyForecastData } from '@/lib/types';

interface Props {
  hourly: HourlyForecastData[];
  weatherCodes?: Record<string, number>; // date string → weather code
}

const qualityColor: Record<string, string> = {
  S: 'bg-amber-400 text-white',
  A: 'bg-cyan-500 text-white',
  B: 'bg-emerald-500 text-white',
  C: 'bg-slate-300 text-slate-700',
  D: 'bg-slate-200 text-slate-500',
};

const dirToDeg: Record<string, number> = {
  N:0,NNE:22.5,NE:45,ENE:67.5,E:90,ESE:112.5,SE:135,SSE:157.5,
  S:180,SSW:202.5,SW:225,WSW:247.5,W:270,WNW:292.5,NW:315,NNW:337.5,
};

const WEEKDAYS = ['日','月','火','水','木','金','土'];

interface Row {
  hour: number;       // 0,3,6,9,12,15,18,21
  time: string;       // ISO
  quality: string;
  waveHeight: number;
  windSpeed: number;
  windDir: string;
  period: number;
  weatherCode?: number;
}

interface DayGroup {
  dateLabel: string;  // "5/7"
  weekday: string;    // "水"
  isSat: boolean;
  isSun: boolean;
  rows: Row[];
}

function groupByDay(hourly: HourlyForecastData[], weatherCodes?: Record<string, number>): DayGroup[] {
  const map = new Map<string, DayGroup>();

  for (const h of hourly) {
    const d = new Date(h.time);
    const hour = d.getHours();
    if (hour % 3 !== 0) continue;

    const dateKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!map.has(dateKey)) {
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const wd = d.getDay();
      map.set(dateKey, {
        dateLabel: `${month}/${day}`,
        weekday: WEEKDAYS[wd],
        isSat: wd === 6,
        isSun: wd === 0,
        rows: [],
      });
    }

    const group = map.get(dateKey)!;
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    group.rows.push({
      hour,
      time: h.time,
      quality: h.quality,
      waveHeight: h.waveHeight,
      windSpeed: h.windSpeed,
      windDir: h.windDir,
      period: h.period,
      weatherCode: weatherCodes?.[dateStr],
    });
  }

  return Array.from(map.values());
}

function QualityBadge({ q }: { q: string }) {
  return (
    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold ${qualityColor[q] ?? qualityColor['D']}`}>
      {q}
    </span>
  );
}

function WindArrow({ dir, speed }: { dir: string; speed: number }) {
  const deg = dirToDeg[dir] ?? 0;
  const label = convertWindDirection(dir);
  const shortLabel = label.length > 3 ? label.slice(0, 3) : label;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center"
        style={{ background: '#F0F9FF' }}
      >
        <ArrowUp size={10} className="text-[#0ea5e9]" style={{ transform: `rotate(${deg}deg)` }} />
      </div>
      <span className="text-[9px] text-[#707072] leading-none">{shortLabel}/{speed.toFixed(1)}</span>
    </div>
  );
}

export default function HourlyForecastTable({ hourly, weatherCodes }: Props) {
  if (!hourly || hourly.length === 0) return null;

  const groups = groupByDay(hourly, weatherCodes);

  return (
    <div className="rounded-xl border border-[#E5E5E5] overflow-hidden text-[#0d1b2a]">
      {/* Header row */}
      <div className="grid bg-[#F5F5F5] border-b border-[#E5E5E5]"
        style={{ gridTemplateColumns: '56px 36px 28px 1fr 1fr 1fr' }}>
        <div className="px-2 py-2 text-[9px] font-bold uppercase tracking-wider text-[#9E9EA0]">日付</div>
        <div className="py-2 text-[9px] font-bold uppercase tracking-wider text-[#9E9EA0] text-center">時刻</div>
        <div className="py-2 text-[9px] font-bold uppercase tracking-wider text-[#9E9EA0] text-center">天気</div>
        <div className="py-2 text-[9px] font-bold uppercase tracking-wider text-[#9E9EA0] text-center">波高</div>
        <div className="py-2 text-[9px] font-bold uppercase tracking-wider text-[#9E9EA0] text-center">周期</div>
        <div className="py-2 text-[9px] font-bold uppercase tracking-wider text-[#9E9EA0] text-center">風向/速</div>
      </div>

      {groups.map((group, gi) => (
        <div key={gi}>
          {group.rows.map((row, ri) => {
            const isFirstRow = ri === 0;
            const isLastGroup = gi === groups.length - 1;
            const isLastRow = ri === group.rows.length - 1;
            const showBorder = !(isLastGroup && isLastRow);

            const dayLabelColor = group.isSun
              ? 'text-rose-500'
              : group.isSat
              ? 'text-sky-500'
              : 'text-[#0d1b2a]';

            return (
              <div
                key={ri}
                className={`grid items-center ${showBorder ? 'border-b border-[#E5E5E5]' : ''} ${isFirstRow && gi > 0 ? 'border-t-2 border-[#E5E5E5]' : ''}`}
                style={{ gridTemplateColumns: '56px 36px 28px 1fr 1fr 1fr' }}
              >
                {/* 日付セル: 初行のみ表示 */}
                <div className="px-2 py-2.5 flex flex-col justify-center" style={{ minHeight: 40 }}>
                  {isFirstRow && (
                    <>
                      <span className={`text-[11px] font-bold leading-none ${dayLabelColor}`}>{group.dateLabel}</span>
                      <span className={`text-[9px] font-medium leading-none mt-0.5 ${dayLabelColor}`}>{group.weekday}</span>
                    </>
                  )}
                </div>

                {/* 時刻 */}
                <div className="py-2.5 text-center">
                  <span className="text-[10px] font-medium text-[#707072]">{String(row.hour).padStart(2,'0')}:00</span>
                </div>

                {/* 天気アイコン: 初行のみ */}
                <div className="py-2.5 flex items-center justify-center">
                  {isFirstRow && row.weatherCode !== undefined
                    ? <WeatherIcon code={row.weatherCode} size={14} />
                    : <span className="text-[10px] text-[#E5E5E5]">·</span>
                  }
                </div>

                {/* 波高 + クオリティ */}
                <div className="py-2.5 flex flex-col items-center gap-0.5">
                  <QualityBadge q={row.quality} />
                  <span className="text-[11px] font-semibold leading-none mt-0.5">
                    {row.waveHeight.toFixed(2)}m
                  </span>
                </div>

                {/* 周期 */}
                <div className="py-2.5 text-center">
                  <span className="text-[11px] font-medium text-[#0d1b2a]">{row.period.toFixed(1)}</span>
                  <span className="text-[9px] text-[#9E9EA0]">秒</span>
                </div>

                {/* 風向・風速 */}
                <div className="py-2.5 flex items-center justify-center">
                  <WindArrow dir={row.windDir} speed={row.windSpeed} />
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
