'use client';

interface ForecastChartProps {
  data: Array<{
    id: string;
    time: string;
    height: string;
    heightValue: number;
    period: number;
    quality: string;
  }>;
}

const qualityBar: Record<string, string> = {
  S: 'from-amber-400 to-orange-500',
  A: 'from-cyan-500 to-sky-400',
  B: 'from-emerald-500 to-teal-400',
  C: 'from-slate-400 to-slate-500',
  D: 'from-slate-300 to-slate-400',
};

export default function ForecastChart({ data }: ForecastChartProps) {
  if (!data.length) return null;

  const maxH = Math.max(...data.map(d => d.heightValue), 0.5);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Bars */}
      <div className="flex-1 flex items-end gap-1 min-h-0">
        {data.map(item => {
          const pct = Math.max((item.heightValue / maxH) * 100, 8);
          const grad = qualityBar[item.quality] ?? qualityBar['D'];
          return (
            <div key={item.id} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <span className="text-[9px] text-[#9E9EA0] leading-none">{item.height}</span>
              <div
                className={`w-full rounded-t-sm bg-gradient-to-t ${grad}`}
                style={{ height: `${pct}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* Time labels */}
      <div className="flex gap-1 mt-1.5">
        {data.map(item => (
          <div key={item.id} className="flex-1 text-center">
            <span className="text-[9px] text-[#9E9EA0]">{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
