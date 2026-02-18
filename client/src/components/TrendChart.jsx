import React, { useMemo } from 'react';
import { format, addDays, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

const TrendChart = ({ data, days = 7 }) => {
    const today = new Date();
    const endDate = addDays(today, days - 1);

    // Generate array of dates for X-axis
    const dates = useMemo(() => {
        return eachDayOfInterval({ start: today, end: endDate });
    }, [days]); // Recalculate if 'days' changes

    // Process data into series by doctor
    const series = useMemo(() => {
        const doctors = {};

        // Group data by doctor
        data.forEach(item => {
            if (!doctors[item.doctor_name]) {
                doctors[item.doctor_name] = {
                    name: item.doctor_name,
                    color: item.doctor_color,
                    data: {}
                };
            }
            doctors[item.doctor_name].data[item.date] = item.count;
        });

        // Fill missing dates with 0 and create array
        return Object.values(doctors).map(doc => {
            const points = dates.map(date => {
                const dateStr = format(date, 'yyyy-MM-dd');
                return doc.data[dateStr] || 0;
            });
            return {
                ...doc,
                points
            };
        });
    }, [data, dates]);

    // Calculate Max Y for scaling
    const maxY = useMemo(() => {
        let max = 0;
        series.forEach(s => {
            max = Math.max(max, ...s.points);
        });
        return Math.max(max, 5); // Minimum 5 for scale
    }, [series]);

    // Chart Dimensions
    const width = 600;
    const height = 200;
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const getX = (index) => padding + (index / (dates.length - 1)) * chartWidth;
    const getY = (value) => height - padding - (value / maxY) * chartHeight;

    // Determine Date format based on range
    const dateFormat = days > 30 ? 'MMM' : 'd MMM';

    // Check if there is any data
    const hasData = useMemo(() => {
        return series.some(s => s.points.some(p => p > 0));
    }, [series]);

    if (!hasData) {
        return (
            <div className="w-full h-[200px] flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <div className="text-gray-400 text-sm mb-2">No hay datos suficientes para mostrar la proyección.</div>
                <div className="text-gray-300 text-xs text-center px-4">
                    Agendá citas futuras para ver la tendencia de demanda por doctor.
                </div>
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto">
            <div className={`min-w-[${days > 30 ? '800px' : '600px'}]`}>
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto bg-white rounded-lg">
                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map(p => {
                        const y = height - padding - p * chartHeight;
                        return (
                            <line
                                key={p}
                                x1={padding}
                                y1={y}
                                x2={width - padding}
                                y2={y}
                                stroke="#f3f4f6"
                                strokeWidth="1"
                            />
                        );
                    })}

                    {/* X Axis Labels - Optimize for longer ranges */}
                    {dates.map((date, i) => {
                        // Show fewer labels for longer ranges
                        if (days > 14 && i % Math.ceil(days / 7) !== 0) return null;

                        return (
                            <text
                                key={i}
                                x={getX(i)}
                                y={height - 5}
                                textAnchor="middle"
                                fontSize="10"
                                fill="#9ca3af"
                            >
                                {format(date, dateFormat, { locale: es })}
                            </text>
                        );
                    })}

                    {/* Lines */}
                    {series.map((s, i) => {
                        const pathD = s.points.map((val, idx) =>
                            `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(val)}`
                        ).join(' ');

                        return (
                            <g key={s.name}>
                                <path
                                    d={pathD}
                                    fill="none"
                                    stroke={s.color || '#3b82f6'}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                {/* Dots - Hide dots for long ranges for clarity */}
                                {days <= 30 && s.points.map((val, idx) => (
                                    <circle
                                        key={idx}
                                        cx={getX(idx)}
                                        cy={getY(val)}
                                        r="3"
                                        fill="white"
                                        stroke={s.color || '#3b82f6'}
                                        strokeWidth="2"
                                    />
                                ))}
                            </g>
                        );
                    })}
                </svg>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 mt-4 justify-center">
                    {series.map(s => (
                        <div key={s.name} className="flex items-center gap-2 text-sm">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color || '#3b82f6' }}></div>
                            <span className="text-gray-600 font-medium">{s.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TrendChart;
