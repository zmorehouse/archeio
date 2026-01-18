import { formatXP } from '@/lib/runescape-utils';
import { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Skill {
    rank: number;
    level: number;
    experience: number;
}

interface Player {
    id: number;
    name: string;
    skills: Record<string, Skill>;
}

interface HistoricalStat {
    fetched_at: string;
    overall_experience: number;
    overall_level: number;
    skills: Record<string, Skill>;
}

interface XpOverTimeComponentProps {
    players: Player[];
    historicalStats?: Record<number, HistoricalStat[]>;
}

interface TimePeriod {
    label: string;
    startDate: Date;
    endDate: Date;
}

interface ChartDataPoint {
    period: TimePeriod;
    players: Record<number, number>; // playerId -> XP gained
}

// Player colors for the chart
const PLAYER_COLORS = [
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#10b981', // Green
    '#f59e0b', // Amber
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316', // Orange
];

export function XpOverTimeComponent({ players, historicalStats = {} }: XpOverTimeComponentProps) {
    const [chartType, setChartType] = useState<'line' | 'bar'>('line');
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | '6month'>('weekly');
    const [playerModalOpen, setPlayerModalOpen] = useState(false);
    const [hoveredData, setHoveredData] = useState<{ x: number; y: number; playerId: number; xp: number; period: TimePeriod } | null>(null);
    const [selectedPlayers, setSelectedPlayers] = useState<Set<number>>(
        new Set(players.map((p) => p.id)),
    );

    const togglePlayer = (playerId: number) => {
        const newSet = new Set(selectedPlayers);
        if (newSet.has(playerId)) {
            newSet.delete(playerId);
        } else {
            newSet.add(playerId);
        }
        setSelectedPlayers(newSet);
    };

    // Generate time periods based on selected period type
    const generateTimePeriods = useCallback((): TimePeriod[] => {
        const now = new Date();
        const periods: TimePeriod[] = [];
        let startDate: Date;
        let endDate: Date = new Date(now);

        if (period === 'daily') {
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
        } else if (period === 'weekly') {
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
        } else if (period === 'monthly') {
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 30);
            startDate.setHours(0, 0, 0, 0);
        } else if (period === '6month') {
            startDate = new Date(now);
            startDate.setMonth(startDate.getMonth() - 6);
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
        } else {
            return [];
        }

        if (period === 'daily') {
            // Every 3 hours for daily
            for (let hour = 0; hour < 24; hour += 3) {
                const periodStart = new Date(startDate);
                periodStart.setHours(hour, 0, 0, 0);
                const periodEnd = new Date(periodStart);
                periodEnd.setHours(hour + 3, 0, 0, 0);
                periods.push({
                    label: `${hour.toString().padStart(2, '0')}:00`,
                    startDate: periodStart,
                    endDate: periodEnd,
                });
            }
        } else if (period === 'weekly') {
            // Per day for weekly
            for (let day = 0; day < 7; day++) {
                const periodStart = new Date(startDate);
                periodStart.setDate(periodStart.getDate() + day);
                const periodEnd = new Date(periodStart);
                periodEnd.setDate(periodEnd.getDate() + 1);
                const dayName = periodStart.toLocaleDateString('en-US', { weekday: 'short' });
                periods.push({
                    label: dayName,
                    startDate: periodStart,
                    endDate: periodEnd,
                });
            }
        } else if (period === 'monthly') {
            // Per half week (every ~3.5 days) for monthly
            const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const halfWeeks = Math.ceil(daysDiff / 3.5);
            for (let i = 0; i < halfWeeks; i++) {
                const periodStart = new Date(startDate.getTime() + i * 3.5 * 24 * 60 * 60 * 1000);
                let periodEnd = new Date(periodStart.getTime() + 3.5 * 24 * 60 * 60 * 1000);
                if (periodEnd > endDate) periodEnd = new Date(endDate);
                periods.push({
                    label: periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    startDate: periodStart,
                    endDate: periodEnd,
                });
            }
        } else if (period === '6month') {
            // Per month for 6 month
            for (let month = 0; month < 6; month++) {
                const periodStart = new Date(startDate);
                periodStart.setMonth(periodStart.getMonth() + month);
                const periodEnd = new Date(periodStart);
                periodEnd.setMonth(periodEnd.getMonth() + 1);
                periods.push({
                    label: periodStart.toLocaleDateString('en-US', { month: 'short' }),
                    startDate: periodStart,
                    endDate: periodEnd,
                });
            }
        }

        return periods;
    }, [period]);

    // Calculate XP gained for each period for each player
    const calculateChartData = useCallback((): ChartDataPoint[] => {
        const timePeriods = generateTimePeriods();
        if (timePeriods.length === 0) return [];

        const chartData: ChartDataPoint[] = timePeriods.map(period => ({
            period,
            players: {},
        }));

        selectedPlayers.forEach(playerId => {
            const stats = historicalStats[playerId] || [];
            if (stats.length < 2) return;

            // Sort stats by date
            const sortedStats = [...stats].sort((a, b) =>
                new Date(a.fetched_at).getTime() - new Date(b.fetched_at).getTime()
            );

            timePeriods.forEach((timePeriod, periodIndex) => {
                // Find stats within this period
                const periodStats = sortedStats.filter(stat => {
                    const statDate = new Date(stat.fetched_at);
                    return statDate >= timePeriod.startDate && statDate < timePeriod.endDate;
                });

                if (periodStats.length >= 2) {
                    const firstStat = periodStats[0];
                    const lastStat = periodStats[periodStats.length - 1];
                    const xpGained = lastStat.overall_experience - firstStat.overall_experience;
                    chartData[periodIndex].players[playerId] = Math.max(0, xpGained);
                } else if (periodStats.length === 1) {
                    // If only one stat in period, try to find previous stat for comparison
                    const statInPeriod = periodStats[0];
                    const previousStats = sortedStats.filter(stat =>
                        new Date(stat.fetched_at) < timePeriod.startDate
                    );
                    if (previousStats.length > 0) {
                        const lastPrevious = previousStats[previousStats.length - 1];
                        const xpGained = statInPeriod.overall_experience - lastPrevious.overall_experience;
                        chartData[periodIndex].players[playerId] = Math.max(0, xpGained);
                    } else {
                        chartData[periodIndex].players[playerId] = 0;
                    }
                } else {
                    chartData[periodIndex].players[playerId] = 0;
                }
            });
        });

        return chartData;
    }, [generateTimePeriods, historicalStats, selectedPlayers]);

    const chartData = useMemo(() => calculateChartData(), [calculateChartData]);

    // Calculate max XP for scaling
    const maxXp = useMemo(() => {
        let max = 0;
        chartData.forEach(point => {
            Object.values(point.players).forEach(xp => {
                if (xp > max) max = xp;
            });
        });
        // Ensure minimum of 1 to avoid division by zero
        return Math.max(max, 1);
    }, [chartData]);

    const chartHeight = 200;
    const chartWidth = 600;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const graphWidth = chartWidth - padding.left - padding.right;
    const graphHeight = chartHeight - padding.top - padding.bottom;

    const getPlayerColor = (playerId: number) => {
        const index = players.findIndex(p => p.id === playerId);
        return PLAYER_COLORS[index % PLAYER_COLORS.length];
    };

    return (
        <div className="h-full flex flex-col">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold">XP Over Time</h3>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex gap-1 w-full sm:w-auto">
                        <button
                            onClick={() => setChartType('line')}
                            className={`flex-1 sm:flex-none rounded px-3 py-1 text-xs transition-colors ${
                                chartType === 'line'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                            }`}
                        >
                            Line
                        </button>
                        <button
                            onClick={() => setChartType('bar')}
                            className={`flex-1 sm:flex-none rounded px-3 py-1 text-xs transition-colors ${
                                chartType === 'bar'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                            }`}
                        >
                            Bar
                        </button>
                    </div>
                    <span className="hidden sm:inline text-neutral-400 dark:text-neutral-600">|</span>
                    <div className="flex gap-1 w-full sm:w-auto">
                        <button
                            onClick={() => setPeriod('daily')}
                            className={`flex-1 sm:flex-none rounded px-3 py-1 text-xs transition-colors ${
                                period === 'daily'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                            }`}
                        >
                            Daily
                        </button>
                        <button
                            onClick={() => setPeriod('weekly')}
                            className={`flex-1 sm:flex-none rounded px-3 py-1 text-xs transition-colors ${
                                period === 'weekly'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                            }`}
                        >
                            Weekly
                        </button>
                        <button
                            onClick={() => setPeriod('monthly')}
                            className={`flex-1 sm:flex-none rounded px-3 py-1 text-xs transition-colors ${
                                period === 'monthly'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                            }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setPeriod('6month')}
                            className={`flex-1 sm:flex-none rounded px-3 py-1 text-xs transition-colors ${
                                period === '6month'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                            }`}
                        >
                            6 Month
                        </button>
                    </div>
                </div>
            </div>

            <div className="mb-3">
                <Dialog open={playerModalOpen} onOpenChange={setPlayerModalOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-xs">
                            Select Players ({selectedPlayers.size}/{players.length})
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <div className="flex items-center justify-between gap-2 pr-8">
                                <DialogTitle>Select Players</DialogTitle>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedPlayers(new Set(players.map(p => p.id)))}
                                        className="text-xs"
                                    >
                                        Select All
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedPlayers(new Set())}
                                        className="text-xs"
                                    >
                                        Deselect All
                                    </Button>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                                Select which players should be included in the bar graph
                            </p>
                        </DialogHeader>
                        <div className="space-y-2 py-4">
                            {players.map((player) => (
                                <label
                                    key={player.id}
                                    className="flex cursor-pointer items-center gap-3 rounded px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedPlayers.has(player.id)}
                                        onChange={() => togglePlayer(player.id)}
                                        className="h-4 w-4"
                                    />
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="h-4 w-4 rounded"
                                            style={{ backgroundColor: getPlayerColor(player.id) }}
                                        />
                                        <span className="text-sm">{player.name}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex-1 overflow-auto overflow-x-auto relative">
                {chartData.length > 0 && (period === 'daily' || period === '6month' || maxXp > 0) ? (
                    <div className="w-full relative">
                        <svg
                            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                            className="w-full h-auto"
                            preserveAspectRatio="xMidYMid meet"
                        >
                            {/* Y-axis grid lines and labels */}
                            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                                const y = padding.top + graphHeight * (1 - ratio);
                                const value = maxXp * ratio;
                                return (
                                    <g key={ratio}>
                                        <line
                                            x1={padding.left}
                                            y1={y}
                                            x2={padding.left + graphWidth}
                                            y2={y}
                                            stroke="currentColor"
                                            strokeWidth="1"
                                            className="text-neutral-200 dark:text-neutral-700"
                                            strokeDasharray="2,2"
                                        />
                                        <text
                                            x={padding.left - 10}
                                            y={y + 4}
                                            textAnchor="end"
                                            className="text-[9px] fill-neutral-500 dark:fill-neutral-400"
                                        >
                                            {formatXP(value)}
                                        </text>
                                    </g>
                                );
                            })}

                            {/* X-axis labels */}
                            {chartData.map((point, index) => {
                                const x = chartData.length > 1 
                                    ? padding.left + (index / (chartData.length - 1)) * graphWidth
                                    : padding.left + graphWidth / 2;
                                return (
                                    <text
                                        key={index}
                                        x={x}
                                        y={chartHeight - padding.bottom + 20}
                                        textAnchor="middle"
                                        className="text-[9px] fill-neutral-500 dark:fill-neutral-400"
                                    >
                                        {point.period.label}
                                    </text>
                                );
                            })}

                            {/* Chart content */}
                            {chartType === 'line' ? (
                                // Line chart
                                Array.from(selectedPlayers).map(playerId => {
                                    const color = getPlayerColor(playerId);
                                    const points: string[] = [];
                                    
                                    chartData.forEach((point, index) => {
                                        const x = chartData.length > 1
                                            ? padding.left + (index / (chartData.length - 1)) * graphWidth
                                            : padding.left + graphWidth / 2;
                                        const yp = point.players[playerId] || 0;
                                        const y = padding.top + graphHeight * (1 - (yp / maxXp));
                                        points.push(`${x},${y}`);
                                    });

                                    if (points.length > 1) {
                                        return (
                                            <g key={playerId}>
                                                <polyline
                                                    points={points.join(' ')}
                                                    fill="none"
                                                    stroke={color}
                                                    strokeWidth="2"
                                                    className="opacity-80"
                                                />
                                                {points.map((point, index) => {
                                                    const [x, y] = point.split(',').map(Number);
                                                    const dataPoint = chartData[index];
                                                    const xp = dataPoint.players[playerId] || 0;
                                                    
                                                    return (
                                                        <circle
                                                            key={index}
                                                            cx={x}
                                                            cy={y}
                                                            r="5"
                                                            fill={color}
                                                            className="opacity-80 cursor-pointer"
                                                            onMouseEnter={(e) => {
                                                                setHoveredData({
                                                                    x: e.clientX,
                                                                    y: e.clientY,
                                                                    playerId,
                                                                    xp,
                                                                    period: dataPoint.period,
                                                                });
                                                            }}
                                                            onMouseLeave={() => setHoveredData(null)}
                                                        />
                                                    );
                                                })}
                                            </g>
                                        );
                                    }
                                    return null;
                                })
                            ) : (
                                // Bar chart (clustered)
                                chartData.map((point, index) => {
                                    const x = chartData.length > 1
                                        ? padding.left + (index / (chartData.length - 1)) * graphWidth
                                        : padding.left + graphWidth / 2;
                                    const barWidth = graphWidth / Math.max(chartData.length, 1) * 0.6;
                                    const barSpacing = barWidth / Math.max(selectedPlayers.size, 1);
                                    let barIndex = 0;

                                    return (
                                        <g key={index}>
                                            {Array.from(selectedPlayers).map(playerId => {
                                                const xp = point.players[playerId] || 0;
                                                const barHeight = (xp / maxXp) * graphHeight;
                                                const barX = x - barWidth / 2 + barIndex * barSpacing;
                                                const barY = padding.top + graphHeight - barHeight;
                                                const color = getPlayerColor(playerId);
                                                barIndex++;
                                                
                                                return (
                                                    <rect
                                                        key={playerId}
                                                        x={barX}
                                                        y={barY}
                                                        width={barSpacing * 0.8}
                                                        height={barHeight}
                                                        fill={color}
                                                        className="opacity-80 cursor-pointer"
                                                        onMouseEnter={(e) => {
                                                            setHoveredData({
                                                                x: e.clientX,
                                                                y: e.clientY,
                                                                playerId,
                                                                xp,
                                                                period: point.period,
                                                            });
                                                        }}
                                                        onMouseLeave={() => setHoveredData(null)}
                                                    />
                                                );
                                            })}
                                        </g>
                                    );
                                })
                            )}

                        </svg>
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center text-neutral-500 dark:text-neutral-400">
                        <p className="text-sm">No data available for selected period</p>
                    </div>
                )}
            </div>

            {/* Tooltip Portal - renders above everything */}
            {hoveredData && typeof document !== 'undefined' && createPortal(
                (() => {
                    const player = players.find(p => p.id === hoveredData.playerId);
                    if (!player) return null;
                    
                    // Calculate average based on period type
                    let avgXp: number;
                    let avgLabel: string;
                    
                    if (period === 'daily') {
                        // Daily view: show average exp/hr across all periods
                        const periodHours = (hoveredData.period.endDate.getTime() - hoveredData.period.startDate.getTime()) / (1000 * 60 * 60);
                        avgXp = periodHours > 0 ? hoveredData.xp / periodHours : 0;
                        avgLabel = '/hr';
                    } else {
                        // Weekly/Monthly/6 Month views: show average exp/day across all periods
                        const periodDays = (hoveredData.period.endDate.getTime() - hoveredData.period.startDate.getTime()) / (1000 * 60 * 60 * 24);
                        avgXp = periodDays > 0 ? hoveredData.xp / periodDays : 0;
                        avgLabel = '/day';
                    }
                    
                    return (
                        <div
                            className="fixed bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded px-3 py-2 shadow-lg text-xs pointer-events-none z-[9999]"
                            style={{
                                left: `${hoveredData.x}px`,
                                top: `${hoveredData.y}px`,
                                transform: 'translate(-50%, calc(-100% - 10px))',
                            }}
                        >
                            <div className="font-semibold mb-1">{player.name}</div>
                            <div className="text-neutral-300 dark:text-neutral-600">
                                XP: {formatXP(hoveredData.xp)}
                            </div>
                            <div className="text-neutral-400 dark:text-neutral-500 text-[10px]">
                                Avg: {formatXP(avgXp)}{avgLabel}
                            </div>
                        </div>
                    );
                })(),
                document.body
            )}
        </div>
    );
}

