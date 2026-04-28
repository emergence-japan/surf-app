'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Wind, MapPin, ChevronDown, ArrowUp } from 'lucide-react';
import type { RegionGroup as RegionGroupType } from '@/lib/regions';
import type { SurfPointDetail } from '@/lib/types';

const qualityConfig: Record<string, {
  label: string;
  barFrom: string;
  barTo: string;
  badge: string;
  regionBadge: string;
}> = {
  S: {
    label: 'EPIC',
    barFrom: 'from-amber-400', barTo: 'to-orange-500',
    badge: 'bg-amber-500 text-white',
    regionBadge: 'bg-amber-50 text-amber-600 border border-amber-200',
  },
  A: {
    label: 'GREAT',
    barFrom: 'from-cyan-500', barTo: 'to-sky-400',
    badge: 'bg-cyan-500 text-white',
    regionBadge: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
  },
  B: {
    label: 'GOOD',
    barFrom: 'from-emerald-500', barTo: 'to-teal-400',
    badge: 'bg-emerald-500 text-white',
    regionBadge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  C: {
    label: 'FAIR',
    barFrom: 'from-slate-400', barTo: 'to-slate-500',
    badge: 'bg-slate-200 text-slate-600',
    regionBadge: 'bg-slate-50 text-slate-500 border border-slate-200',
  },
  D: {
    label: 'POOR',
    barFrom: 'from-slate-300', barTo: 'to-slate-400',
    badge: 'bg-slate-100 text-slate-500',
    regionBadge: 'bg-slate-50 text-slate-400 border border-slate-200',
  },
};

function SpotRow({ point }: { point: SurfPointDetail }) {
  const [prefecture, ...spotParts] = point.beach.split(/\s+/);
  const spotName = spotParts.join(' ') || point.beach;
  const cfg = qualityConfig[point.quality] ?? qualityConfig['D'];

  return (
    <Link href={`/point/${point.id}`}>
      <div className="spot-card group flex items-center gap-2 px-3 py-3">
        <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold ${cfg.badge}`}>
          {point.quality}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-[#0d1b2a] leading-snug truncate group-hover:text-[#06b6d4] transition-colors duration-200">
            {spotName}
          </p>
          <p className="text-[11px] text-[#9E9EA0] font-medium">{prefecture}</p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <div className="flex items-end gap-[2px] h-5">
            {[0.3, 0.6, 1.0, 1.5, 2.0].map((threshold, i) => {
              const filled = (point.heightMeters ?? 0) >= threshold;
              return (
                <div
                  key={i}
                  className={`w-1 rounded-sm ${filled ? `bg-gradient-to-t ${cfg.barFrom} ${cfg.barTo}` : 'bg-[#E5E5E5]'}`}
                  style={{ height: `${40 + i * 13}%` }}
                />
              );
            })}
          </div>
          <div className="text-right">
            <p className="text-[13px] font-semibold text-[#0d1b2a] leading-none whitespace-nowrap">
              {point.heightMeters?.toFixed(1) ?? '—'} m
            </p>
            <div className="flex items-center gap-0.5 justify-end mt-0.5">
              <Wind size={9} className="text-[#CACACB]" />
              <span className="text-[10px] text-[#9E9EA0] whitespace-nowrap">{point.windSpeed?.toFixed(1) ?? '—'}</span>
            </div>
          </div>
        </div>
        <ArrowUp size={12} className="shrink-0 text-[#CACACB] -rotate-90" />
      </div>
    </Link>
  );
}

interface Props {
  group: RegionGroupType;
  defaultOpen?: boolean;
}

export function RegionGroup({ group, defaultOpen = false }: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const cfg = qualityConfig[group.bestQuality] ?? qualityConfig['D'];

  return (
    <div className="rounded-xl border border-[#E5E5E5] overflow-hidden">
      {/* Region header */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-white hover:bg-[#FAFAFA] transition-colors duration-150 text-left"
      >
        {/* Best quality badge */}
        <span className={`shrink-0 text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1 rounded-full ${cfg.regionBadge}`}>
          {group.bestQuality} · {cfg.label}
        </span>

        {/* Region name */}
        <span className="flex-1 text-[15px] font-semibold text-[#0d1b2a]">
          {group.region}
        </span>

        {/* Spot count */}
        <span className="text-[12px] text-[#9E9EA0] font-medium shrink-0">
          {group.points.length} スポット
        </span>

        {/* Chevron */}
        <ChevronDown
          size={16}
          className={`shrink-0 text-[#CACACB] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Spot list */}
      {isOpen && (
        <div className="border-t border-[#E5E5E5] flex flex-col gap-1.5 p-2 bg-[#FAFAFA]">
          {group.points.map(point => (
            <SpotRow key={point.id} point={point} />
          ))}
        </div>
      )}
    </div>
  );
}
