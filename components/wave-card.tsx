'use client';

import { ChevronDown, Wind, Droplets } from 'lucide-react';
import { convertWindDirection } from '@/lib/converters';

interface WaveCardProps {
  wave: {
    id: string;
    time: string;
    height: string;
    period: number;
    windSpeed: number;
    windDirection: string;
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    temperature: number;
  };
  isExpanded: boolean;
  onExpand: () => void;
}

const qualityColors = {
  excellent: 'bg-accent/20 border-accent',
  good: 'bg-emerald-500/20 border-emerald-500',
  fair: 'bg-yellow-500/20 border-yellow-500',
  poor: 'bg-red-500/20 border-red-500',
};

const qualityBgColors = {
  excellent: 'bg-accent',
  good: 'bg-emerald-500',
  fair: 'bg-yellow-500',
  poor: 'bg-red-500',
};

export default function WaveCard({ wave, isExpanded, onExpand }: WaveCardProps) {
  const qColor = qualityColors[wave.quality];
  const qBgColor = qualityBgColors[wave.quality];

  return (
    <button
      onClick={onExpand}
      className={`w-full text-left bg-card rounded-lg border-2 transition-all duration-300 ${
        isExpanded ? 'border-accent p-6' : `border-border p-4 hover:border-accent/50 ${qColor}`
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">
            {wave.time}
          </p>
          <p className="text-2xl font-light text-foreground">
            {wave.height}
          </p>
        </div>
        <div className={`px-3 py-1 rounded text-xs font-semibold text-white ${qBgColor}`}>
          {wave.quality.charAt(0).toUpperCase() + wave.quality.slice(1)}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Droplets size={16} className="text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">周期</p>
            <p className="text-sm font-medium text-foreground">{wave.period}秒</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Wind size={16} className="text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">風速</p>
            <p className="text-sm font-medium text-foreground">{Math.round(wave.windSpeed * 0.514)} m/s</p>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">風向</span>
            <span className="text-sm font-medium text-foreground">{convertWindDirection(wave.windDirection)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">水温</span>
            <span className="text-sm font-medium text-foreground">{wave.temperature}°C</span>
          </div>
        </div>
      )}

      {/* Expand Indicator */}
      <div className="flex justify-center mt-3">
        <ChevronDown
          size={18}
          className={`text-muted-foreground transition-transform duration-300 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </div>
    </button>
  );
}
