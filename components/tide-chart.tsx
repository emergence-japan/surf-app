'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer } from 'recharts';

interface TideChartProps {
  data: Array<{ time: string; height: number }>;
}

export default function TideChart({ data }: TideChartProps) {
  if (!data || data.length === 0) return null;

  const minH = Math.min(...data.map(d => d.height));
  const maxH = Math.max(...data.map(d => d.height));
  const domainMin = Math.floor(minH - 0.1);
  const domainMax = Math.ceil(maxH + 0.1);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="tideGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10, fill: '#9E9EA0' }}
          axisLine={false}
          tickLine={false}
          interval={5}
        />
        <YAxis
          domain={[domainMin, domainMax]}
          tick={{ fontSize: 10, fill: '#9E9EA0' }}
          axisLine={false}
          tickLine={false}
        />
        <ReferenceLine y={0} stroke="#CACACB" strokeDasharray="3 3" />
        <Area
          type="monotone"
          dataKey="height"
          stroke="#06b6d4"
          strokeWidth={2}
          fill="url(#tideGrad)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
