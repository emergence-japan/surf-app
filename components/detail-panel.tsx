'use client';

import { Eye, Zap, Cloud, Thermometer, Compass } from 'lucide-react';
import { convertWindDirection } from '@/lib/converters';

interface DetailPanelProps {
  data?: {
    temperature: number;
    windSpeed: number;
    windDirection: string;
    period: number;
    quality: string;
    visibility?: number;
    cloudCover?: number;
  };
}

export default function DetailPanel({ data }: DetailPanelProps) {
  if (!data) {
    return null;
  }

  // API returns Celsius and m/s directly
  const tempCelsius = Math.round(data.temperature);
  const windMs = data.windSpeed.toFixed(1);
  
  // 視程: m -> km (小数点1桁)
  const visibilityKm = data.visibility !== undefined ? (data.visibility / 1000).toFixed(1) + ' km' : '-';
  // 雲量: %
  const cloudCoverStr = data.cloudCover !== undefined ? data.cloudCover + '%' : '-';

  const details = [
    {
      icon: Thermometer,
      label: '気温', 
      value: `${tempCelsius}°C`,
      color: 'text-orange-400',
    },
    {
      icon: Cloud,
      label: '風速',
      value: `${windMs} m/s`,
      color: 'text-blue-400',
    },
    {
      icon: Compass,
      label: '風向',
      value: convertWindDirection(data.windDirection),
      color: 'text-cyan-400',
    },
    {
      icon: Zap,
      label: 'うねり周期',
      value: `${data.period}秒`,
      color: 'text-purple-400',
    },
    {
      icon: Eye,
      label: '視程',
      value: visibilityKm,
      color: 'text-green-400',
    },
    {
      icon: Cloud,
      label: '雲量',
      value: cloudCoverStr,
      color: 'text-gray-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {details.map((detail, index) => {
        const Icon = detail.icon;
        return (
          <div
            key={index}
            className="bg-card rounded-lg p-6 border border-border hover:border-accent/50 transition-colors"
          >
            <div className={`${detail.color} mb-4`}>
              <Icon size={28} />
            </div>
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
              {detail.label}
            </p>
            <p className="text-2xl font-light text-foreground">
              {detail.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
