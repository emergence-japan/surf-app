'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface TideChartProps {
    data: Array<{
        time: string;
        height: number; // Tide height in cm or m
    }>;
}

export default function TideChart({ data }: TideChartProps) {
    if (!data || data.length === 0) return null;

    const minHeight = Math.min(...data.map(d => d.height));
    const maxHeight = Math.max(...data.map(d => d.height));
    const domainMin = Math.floor(minHeight - 0.2);
    const domainMax = Math.ceil(maxHeight + 0.2);

    return (
        <div className="w-full h-80">
            <div className="text-xs text-muted-foreground mb-2">Tide Level (m)</div>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 0,
                        left: -20,
                        bottom: 30,
                    }}
                >
                    <defs>
                        <linearGradient id="colorTide" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                        dataKey="time"
                        tick={{ fontSize: 11, fill: '#ffffff' }}
                        tickLine={{ stroke: 'hsl(var(--border))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        interval={2}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                    />
                    <YAxis
                        domain={[domainMin, domainMax]}
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value: number) => [`${value.toFixed(2)} m`, 'Tide Level']}
                    />
                    <Area
                        type="monotone"
                        dataKey="height"
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorTide)"
                    />
                    {/* Mean Sea Level Reference */}
                    <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
