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

// Y軸目盛り（メートル）
const Y_TICKS = [0, 0.5, 1, 1.5, 2];
const Y_MAX = 2; // 絶対スケールの上限

export default function ForecastChart({ data }: ForecastChartProps) {
  if (!data.length) return null;

  // 絶対スケール（実測波高がY_MAXを超える場合は動的に拡張）
  const observedMax = Math.max(...data.map(d => d.heightValue));
  const ceilMax = observedMax > Y_MAX ? Math.ceil(observedMax * 2) / 2 : Y_MAX;

  return (
    <div className="w-full h-full flex">
      {/* Y axis labels */}
      <div className="flex flex-col justify-between pr-2 pb-5">
        {Y_TICKS.slice().reverse().map(t => (
          <span key={t} className="text-[9px] text-[#9E9EA0] leading-none">{t}m</span>
        ))}
      </div>

      {/* Plot area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Gridlines */}
        <div className="absolute inset-0 flex flex-col justify-between pb-5 pointer-events-none">
          {Y_TICKS.slice().reverse().map(t => (
            <div key={t} className="border-t border-dashed border-[#E5E5E5] h-0" />
          ))}
        </div>

        {/* Bars */}
        <div className="flex-1 flex items-end gap-[3px] min-h-0 relative z-10">
          {data.map(item => {
            const pct = Math.min(100, (item.heightValue / ceilMax) * 100);
            const grad = qualityBar[item.quality] ?? qualityBar['D'];
            return (
              <div key={item.id} className="flex-1 flex flex-col items-center justify-end h-full">
                <div
                  className={`w-full rounded-t-sm bg-gradient-to-t ${grad}`}
                  style={{ height: `${Math.max(pct, 2)}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Time labels (3時間刻みなので偶数番目のみ表示。右端は描画範囲外になるので、表示する最後のラベル以降は省略) */}
        <div className="flex gap-[3px] h-5 items-center">
          {data.map((item, i) => {
            // 偶数番目のみ表示
            const evenIndex = i % 2 === 0;
            // ただし末尾2コマはラベル中央が枠外に出るので非表示
            const inRange = i <= data.length - 3;
            const showLabel = evenIndex && inRange;
            return (
              <div key={item.id} className="flex-1 text-center">
                {showLabel && <span className="text-[9px] text-[#9E9EA0]">{item.time}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
