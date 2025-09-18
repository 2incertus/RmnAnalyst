import React from 'react';
import type { KpiTrend } from '../types';

interface TrendChartProps {
  trends: KpiTrend[];
}

const formatValue = (value: number, title: string) => {
    if (title.toLowerCase().includes('sales') || title.toLowerCase().includes('spend')) {
        return `$${(value / 1000).toFixed(0)}k`;
    }
    if (title.toLowerCase().includes('roas')) {
        return value.toFixed(1) + 'x';
    }
    return value.toLocaleString();
};

const CHART_COLORS = ['#38bdf8', '#fbbf24', '#34d399'];


const TrendChart: React.FC<TrendChartProps> = ({ trends }) => {
  if (!trends || trends.length === 0) return null;

  const allPeriods = [...new Set(trends.flatMap(t => t.data.map(d => d.period)))].sort();
  const maxValue = Math.max(...trends.flatMap(t => t.data.map(d => d.value)), 0);
  const chartHeight = 200;
  const chartWidth = 500; // Fixed width for simplicity
  const chartPadding = 40;

  const getX = (index: number) => (index / (allPeriods.length - 1)) * (chartWidth - chartPadding * 2) + chartPadding;
  const getY = (value: number) => chartHeight - (value / maxValue) * chartHeight + 10;

  return (
    <div>
      {/* Legend */}
      <div className="flex justify-center gap-4 mb-4">
        {trends.map((trend, i) => (
          <div key={trend.metric} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}></div>
            <span className="text-sm text-slate-600">{trend.metric}</span>
          </div>
        ))}
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          width="100%"
          height={chartHeight + 60}
          viewBox={`0 0 ${chartWidth} ${chartHeight + 60}`}
          aria-label="Combined KPI Trends Chart"
          className="min-w-[400px]"
        >
          <g>
            {/* X-Axis Labels */}
            {allPeriods.map((period, i) => (
              <text
                key={period}
                x={getX(i)}
                y={chartHeight + 40}
                textAnchor="middle"
                className="text-xs fill-slate-500"
              >
                {period.slice(4, 6)}/{period.slice(0, 4)}
              </text>
            ))}

            {/* Y-Axis Line */}
            <line x1={chartPadding} y1={10} x2={chartPadding} y2={chartHeight + 10} className="stroke-slate-300" />


            {/* Trend Lines and Points */}
            {trends.map((trend, trendIndex) => {
              const color = CHART_COLORS[trendIndex % CHART_COLORS.length];
              const pathData = trend.data
                .map((d, i) => {
                  const periodIndex = allPeriods.indexOf(d.period);
                  if (periodIndex === -1) return '';
                  const x = getX(periodIndex);
                  const y = getY(d.value);
                  return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
                })
                .join(' ');

              return (
                <g key={trend.metric}>
                  <path d={pathData} fill="none" stroke={color} strokeWidth="2" />
                  {trend.data.map(d => {
                    const periodIndex = allPeriods.indexOf(d.period);
                    if (periodIndex === -1) return null;
                    const x = getX(periodIndex);
                    const y = getY(d.value);

                    return (
                      <g key={`${trend.metric}-${d.period}`} className="group">
                        <circle cx={x} cy={y} r="4" fill={color} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        <text
                          x={x}
                          y={y - 10}
                          textAnchor="middle"
                          className="text-xs font-bold fill-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {formatValue(d.value, trend.metric)}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};

export default TrendChart;
