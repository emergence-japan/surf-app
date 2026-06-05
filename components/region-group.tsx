'use client';

import { useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import type { RegionGroup as RegionGroupType, PrefectureGroup } from '@/lib/regions';
import { SpotRow, qualityConfig } from '@/components/spot-row';

function PrefectureSection({ prefGroup }: { prefGroup: PrefectureGroup }) {
  const cfg = qualityConfig[prefGroup.bestQuality] ?? qualityConfig['D'];
  return (
    <div className="border-b border-[#E5E5E5] last:border-b-0">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F3F4F6]">
        <MapPin size={10} className="text-[#9E9EA0]" />
        <span className="text-[11px] font-semibold text-[#6B7280] tracking-wide">{prefGroup.prefecture}</span>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${cfg.regionBadge}`}>
          {prefGroup.bestQuality}
        </span>
      </div>
      <div className="flex flex-col gap-1 p-1.5">
        {prefGroup.points.map(point => (
          <SpotRow key={point.id} point={point} />
        ))}
      </div>
    </div>
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
          {group.prefectures.reduce((s, p) => s + p.points.length, 0)} スポット
        </span>

        {/* Chevron */}
        <ChevronDown
          size={16}
          className={`shrink-0 text-[#CACACB] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Spot list grouped by prefecture */}
      {isOpen && (
        <div className="border-t border-[#E5E5E5] flex flex-col bg-[#FAFAFA]">
          {group.prefectures.map(prefGroup => (
            <PrefectureSection key={prefGroup.prefecture} prefGroup={prefGroup} />
          ))}
        </div>
      )}
    </div>
  );
}
