'use client';

import { ChevronDown, Wind, Droplets, Clock } from 'lucide-react';
import { convertWindDirection } from '@/lib/converters';
import VisualWaveHeight from './visual-wave-height';

interface WaveCardProps {
  wave: {
    id: string;
    time: string;
    height: string;
    heightValue?: number;
    period: number;
    windSpeed: number;
    windDirection: string;
    quality: 'S' | 'A' | 'B' | 'C' | 'D';
    temperature: number;
  };
  isExpanded: boolean;
  onExpand: () => void;
}

const qualityColors = {
  S: 'text-indigo-600 bg-indigo-50 border-indigo-100',
  A: 'text-blue-500 bg-blue-50 border-blue-100',
  B: 'text-emerald-500 bg-emerald-50 border-emerald-100',
  C: 'text-amber-500 bg-amber-50 border-amber-100',
  D: 'text-slate-500 bg-slate-50 border-slate-100',
};

const qualityBgColors = {
  S: 'bg-indigo-600',
  A: 'bg-blue-500',
  B: 'bg-emerald-500',
  C: 'bg-amber-500',
  D: 'bg-slate-500',
};

const qualityLabels = {
  S: '最高',
  A: '良い',
  B: '普通',
  C: '微妙',
  D: '悪い',
};

export default function WaveCard({ wave, isExpanded, onExpand }: WaveCardProps) {
  const qStyle = qualityColors[wave.quality];
  const qBgColor = qualityBgColors[wave.quality];
  const qLabel = qualityLabels[wave.quality];

  return (
    <button
      onClick={onExpand}
      className={`group w-full text-left glass-card rounded-[2rem] transition-all duration-500 border-white/40 overflow-hidden ${
        isExpanded 
          ? 'ring-2 ring-blue-500/20 shadow-2xl p-8' 
          : 'p-6 hover:-translate-y-1 hover:shadow-xl'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-colors">
            <Clock size={16} />
          </div>
          <p className="text-sm font-bold tracking-tight text-foreground">
            {wave.time}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase border ${qStyle}`}>
          {qLabel}
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">波のサイズ</p>
          <p className="text-3xl font-light text-foreground tracking-tighter leading-none">
            {wave.height}
          </p>
        </div>
        <div className="relative">
          <VisualWaveHeight heightMeters={wave.heightValue ?? 0} className="w-16 h-16" />
          <div className="absolute inset-0 bg-blue-400/10 blur-xl rounded-full -z-10 group-hover:bg-blue-400/20 transition-all" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Droplets size={12} className="text-blue-400" />
            <span className="text-[9px] font-bold uppercase tracking-wider">周期</span>
          </div>
          <p className="text-sm font-semibold">{wave.period}秒</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Wind size={12} className="text-blue-400" />
            <span className="text-[9px] font-bold uppercase tracking-wider">風速</span>
          </div>
          <p className="text-sm font-semibold">{Math.round(wave.windSpeed)} <span className="text-[10px] font-normal text-muted-foreground">m/s</span></p>
        </div>
      </div>

      {/* Expanded Content */}
      <div className={`overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-40 mt-6 pt-6 border-t border-blue-50 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">風の向き</p>
            <p className="text-sm font-medium">{convertWindDirection(wave.windDirection)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">水温</p>
            <p className="text-sm font-medium">{wave.temperature}°C</p>
          </div>
        </div>
      </div>

      {/* Expand Indicator */}
      <div className="flex justify-center mt-6">
        <div className={`w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center transition-all duration-300 ${isExpanded ? 'bg-blue-500 text-white' : 'text-blue-400 group-hover:bg-blue-100'}`}>
          <ChevronDown
            size={16}
            className={`transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </div>
    </button>
  );
}
