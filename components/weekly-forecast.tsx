import { ArrowUp, Calendar, Wind } from 'lucide-react';
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
        return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`;
    };

    if (!data || data.length === 0) return null;

    return (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30">
                <h3 className="font-medium flex items-center gap-2">
                    <Calendar size={18} className="text-muted-foreground" />
                    週間予報
                </h3>
            </div>
            <div className="divide-y divide-border">
                {data.map((day, i) => (
                    <div key={i} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                        <div className="w-24 flex-shrink-0">
                            <p className="font-medium text-foreground">{formatDate(day.time)}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <span className="text-blue-500">水温: {typeof day.temperatureMax === 'number' ? day.temperatureMax.toFixed(1) : '-'}°</span>
                            </div>
                        </div>

                        <div className="flex-1 px-4">
                            <div className="flex flex-col">
                                <span className="font-bold text-accent">{day.waveLabel}</span>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>Swell: {day.rawWaveHeight.toFixed(1)}m</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-24 text-right flex flex-col items-end">
                            <div className="flex items-center gap-1">
                                <Wind size={14} className="text-muted-foreground" />
                                <span className={`font-medium ${day.windSpeedMax > 6 ? 'text-red-500' : 'text-foreground'}`}>
                                    {day.windSpeedMax.toFixed(1)}
                                </span>
                                <span className="text-xs text-muted-foreground">m/s</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <span>{convertWindDirection(day.windDir)}</span>
                                <ArrowUp
                                    size={12}
                                    style={{ transform: `rotate(${dirToDeg[day.windDir] || 0}deg)` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div >
    );
}
