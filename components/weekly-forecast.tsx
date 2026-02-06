'use client';

import { ArrowUp, Calendar, Wind, Thermometer, Waves } from 'lucide-react';
import { convertWindDirection } from '@/lib/converters';

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

const dirToDeg: Record<string, number> = {
    N: 0, NNE: 22.5, NE: 45, ENE: 67.5,
    E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
    S: 180, SSW: 202.5, SW: 225, WSW: 247.5,
    W: 270, WNW: 292.5, NW: 315, NNW: 337.5
};

export default function WeeklyForecast({ data }: WeeklyForecastProps) {
    const formatDate = (isoString: string) => {
        const d = new Date(isoString);
        const days = ['日', '月', '火', '水', '木', '金', '土'];
        return {
            date: `${d.getMonth() + 1}/${d.getDate()}`,
            day: days[d.getDay()]
        };
    };

    if (!data || data.length === 0) return null;

    return (
        <div className="glass-card rounded-[2.5rem] border-white/40 overflow-hidden">
            <div className="p-8 border-b border-blue-50 bg-blue-50/30">
                <h3 className="text-xl font-semibold flex items-center gap-3">
                    <Calendar size={22} className="text-blue-500" />
                    週間予報
                </h3>
            </div>
            <div className="divide-y divide-blue-50">
                {data.map((day, i) => {
                    const { date, day: dayName } = formatDate(day.time);
                    return (
                        <div key={i} className="p-6 flex items-center justify-between hover:bg-blue-50/50 transition-all group">
                            <div className="w-24 flex-shrink-0">
                                <p className="text-xs font-black tracking-widest text-blue-500 uppercase">{dayName}曜日</p>
                                <p className="text-xl font-light text-foreground">{date}</p>
                            </div>

                            <div className="flex-1 flex items-center gap-8 px-6">
                                <div className="flex flex-col">
                                    <span className={`text-lg font-bold ${
                                        day.quality === 'S' ? 'text-indigo-600' :
                                        day.quality === 'A' ? 'text-blue-500' :
                                        day.quality === 'B' ? 'text-emerald-500' :
                                        day.quality === 'C' ? 'text-amber-500' : 'text-slate-500'
                                    }`}>
                                        {day.waveLabel}
                                    </span>
                                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
                                        <span className="flex items-center gap-1"><Waves size={12} className="text-blue-400" /> うねり: {day.rawWaveHeight.toFixed(1)}m</span>
                                        <span className="flex items-center gap-1"><Thermometer size={12} className="text-blue-400" /> 最高水温: {day.temperatureMax.toFixed(1)}°C</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <div className="flex items-center justify-end gap-1 mb-1">
                                        <Wind size={14} className="text-muted-foreground" />
                                        <span className={`text-lg font-semibold tracking-tighter ${day.windSpeedMax > 6 ? 'text-amber-600' : 'text-foreground'}`}>
                                            {day.windSpeedMax.toFixed(1)}
                                        </span>
                                        <span className="text-[10px] font-bold text-muted-foreground">m/s</span>
                                    </div>
                                    <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                                        <span>{convertWindDirection(day.windDir)}</span>
                                        <div className="w-4 h-4 rounded-full bg-blue-50 flex items-center justify-center">
                                            <ArrowUp
                                                size={10}
                                                className="text-blue-500"
                                                style={{ transform: `rotate(${dirToDeg[day.windDir] || 0}deg)` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className={`w-2 h-12 rounded-full opacity-30 group-hover:opacity-100 transition-opacity ${
                                    day.quality === 'S' ? 'bg-indigo-600' :
                                    day.quality === 'A' ? 'bg-blue-500' :
                                    day.quality === 'B' ? 'bg-emerald-500' :
                                    day.quality === 'C' ? 'bg-amber-500' : 'bg-slate-500'
                                }`} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div >
    );
}
