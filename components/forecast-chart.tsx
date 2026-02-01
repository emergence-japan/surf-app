'use client';

interface ForecastChartProps {
  data: Array<{
    id: string;
    time: string;
    height: string;
    heightValue: number;
    period: number;
  }>;
}

export default function ForecastChart({ data }: ForecastChartProps) {
  // Extract heights as numbers for visualization
  const heights = data.map((d) => d.heightValue);

  const maxHeight = Math.max(...heights, 1.0); // 最低でも1.0mのスケーリング
  const minHeight = 0;
  const range = maxHeight - minHeight;

  return (
    <div className="w-full">
      {/* Chart Header */}
      <div className="mb-8">
        <h3 className="text-lg font-light text-foreground mb-2">波高の推移</h3>
        <p className="text-sm text-muted-foreground">今後12時間の予報</p>
      </div>

      {/* Chart */}
      <div className="space-y-6">
        {/* Bars */}
        <div className="flex items-end justify-between gap-4 h-48">
          {data.map((item, index) => {
            const normalizedHeight = ((heights[index] - minHeight) / range) * 100;
            return (
              <div
                key={item.id}
                className="flex-1 flex flex-col items-center gap-2"
              >
                {/* Bar */}
                <div className="w-full flex items-end justify-center h-40">
                  <div
                    className="w-12 bg-gradient-to-t from-accent to-accent/60 rounded-t-lg transition-all hover:from-accent hover:to-accent/70 hover:w-16"
                    style={{
                      height: `${Math.max(normalizedHeight, 10)}%`,
                    }}
                  />
                </div>
                {/* Value */}
                <div className="text-center">
                  <p className="text-xs font-medium text-accent">{item.height}</p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground mb-2">うねりの周期</p>
            <p className="text-sm font-medium text-foreground">
              {Math.min(...data.map((d) => d.period))}s - {Math.max(...data.map((d) => d.period))}s
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">ベストタイム</p>
            <p className="text-sm font-medium text-accent">
              {data[0]?.time}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
