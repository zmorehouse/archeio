import { useState, useMemo } from 'react';

interface Activity {
    rank: number;
    score: number;
}

interface PlayerBossKillsComponentProps {
    activities?: Record<string, Activity>;
}

// Helper function to generate pie chart paths
function createPieSlice(cx: number, cy: number, radius: number, startAngle: number, endAngle: number): string {
    const angleDiff = endAngle - startAngle;
    if (angleDiff >= 360 || (startAngle === 0 && endAngle >= 360)) {
        return [
            "M", cx, cy,
            "L", cx, cy - radius,
            "A", radius, radius, 0, 1, 1, cx, cy + radius,
            "A", radius, radius, 0, 1, 1, cx, cy - radius,
            "Z"
        ].join(" ");
    }
    
    const start = polarToCartesian(cx, cy, radius, endAngle);
    const end = polarToCartesian(cx, cy, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
        "M", cx, cy,
        "L", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
        "Z"
    ].join(" ");
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

// Check if an activity is a boss
function isBossActivity(activityName: string): boolean {
    const lowerName = activityName.toLowerCase();
    return lowerName.includes('boss') ||
        lowerName.includes('kill') ||
        lowerName.includes('chest') ||
        lowerName.includes('chambers') ||
        lowerName.includes('theatre') ||
        lowerName.includes('inferno') ||
        lowerName.includes('gauntlet') ||
        lowerName.includes('nightmare') ||
        lowerName.includes('nex') ||
        lowerName.includes('zulrah') ||
        lowerName.includes('vorkath') ||
        lowerName.includes('cerberus') ||
        lowerName.includes('kraken') ||
        lowerName.includes('sire') ||
        lowerName.includes('hydra') ||
        lowerName.includes('barrows') ||
        lowerName.includes('corp') ||
        lowerName.includes('zilyana') ||
        lowerName.includes('bandos') ||
        lowerName.includes('armadyl') ||
        lowerName.includes('saradomin') ||
        lowerName.includes('zamorak');
}

// Generate a color for a boss based on its name
function getBossColor(bossName: string): string {
    let hash = 0;
    for (let i = 0; i < bossName.length; i++) {
        hash = bossName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = Math.abs(hash) % 360;
    const saturation = 60 + (Math.abs(hash) % 20);
    const lightness = 45 + (Math.abs(hash) % 15);
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Format boss name nicely
function formatBossName(activityName: string): string {
    return activityName
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

export function PlayerBossKillsComponent({ activities = {} }: PlayerBossKillsComponentProps) {
    const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
    const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
    
    // Calculate boss kills
    const bossKills = useMemo(() => {
        const kills: Record<string, number> = {};
        
        Object.entries(activities).forEach(([activityName, activity]) => {
            if (isBossActivity(activityName) && activity.score > 0) {
                const bossName = formatBossName(activityName);
                kills[bossName] = activity.score;
            }
        });
        
        return kills;
    }, [activities]);
    
    const totalKills = Object.values(bossKills).reduce((sum, kills) => sum + kills, 0);
    
    // All bosses for pie chart
    const allBossPercentages = useMemo(() => {
        return Object.entries(bossKills)
            .map(([boss, kills]) => ({
                boss,
                kills,
                percentage: totalKills > 0 ? (kills / totalKills) * 100 : 0,
            }))
            .sort((a, b) => b.kills - a.kills);
    }, [bossKills, totalKills]);
    
    // Top 16 for legend
    const bossPercentages = useMemo(() => {
        return allBossPercentages.slice(0, 16);
    }, [allBossPercentages]);
    
    // Calculate pie chart slices
    const pieSlices = useMemo(() => {
        if (allBossPercentages.length === 0 || totalKills === 0) return [];
        
        let currentAngle = 0;
        return allBossPercentages.map((item) => {
            const sliceAngle = (item.percentage / 100) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + sliceAngle;
            currentAngle = endAngle;
            
            return {
                ...item,
                startAngle,
                endAngle,
                color: getBossColor(item.boss),
            };
        });
    }, [allBossPercentages, totalKills]);
    
    const cx = 125;
    const cy = 125;
    const radius = 100;
    
    return (
        <div className="h-full flex flex-col">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold">Boss Kills Distribution</h3>
                <div className="flex gap-1 w-full sm:w-auto">
                    <button
                        onClick={() => setChartType('pie')}
                        className={`flex-1 sm:flex-none rounded px-3 py-1 text-xs transition-colors ${
                            chartType === 'pie'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                        }`}
                    >
                        Pie
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
            </div>
            
            {allBossPercentages.length > 0 ? (
                chartType === 'pie' ? (
                    <div className="flex-1 flex items-center gap-4 overflow-hidden relative">
                        {/* Left-side legend for top 16 */}
                        <div className="flex-shrink-0 space-y-1.5 py-2 max-h-full overflow-y-auto">
                            {bossPercentages.map(({ boss, percentage }) => {
                                const isHovered = hoveredSlice === boss;
                                return (
                                    <div
                                        key={boss}
                                        className={`flex items-center gap-2 text-xs cursor-pointer transition-opacity ${
                                            isHovered ? 'opacity-100' : hoveredSlice ? 'opacity-40' : 'opacity-100'
                                        }`}
                                        onMouseEnter={() => setHoveredSlice(boss)}
                                        onMouseLeave={() => setHoveredSlice(null)}
                                    >
                                        <div
                                            className="h-3 w-3 rounded flex-shrink-0"
                                            style={{ backgroundColor: getBossColor(boss) }}
                                        />
                                        <span className="font-medium truncate min-w-0">{boss}</span>
                                        <span className="text-neutral-500 dark:text-neutral-400 flex-shrink-0">
                                            {percentage.toFixed(1)}%
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Pie chart */}
                        <div className="flex-1 flex items-center justify-end relative">
                            <svg viewBox="0 0 250 250" className="w-full max-w-[400px] h-auto">
                                {pieSlices.map((slice) => {
                                    const isHovered = hoveredSlice === slice.boss;
                                    const isFullCircle = pieSlices.length === 1 && slice.percentage >= 99.9;
                                    const isLarge = slice.percentage > 10;
                                    const midAngle = (slice.startAngle + slice.endAngle) / 2;
                                    const labelRadius = radius * 0.7;
                                    const labelX = cx + labelRadius * Math.cos((midAngle - 90) * Math.PI / 180);
                                    const labelY = cy + labelRadius * Math.sin((midAngle - 90) * Math.PI / 180);
                                    
                                    return (
                                        <g key={slice.boss}>
                                            <path
                                                d={createPieSlice(cx, cy, radius, slice.startAngle, slice.endAngle)}
                                                fill={slice.color}
                                                stroke={isFullCircle ? "none" : "white"}
                                                strokeWidth={isFullCircle ? "0" : "2"}
                                                style={{ 
                                                    opacity: isHovered ? 1 : hoveredSlice ? 0.3 : 1,
                                                    cursor: 'pointer',
                                                    transition: 'opacity 0.2s'
                                                }}
                                                onMouseEnter={() => setHoveredSlice(slice.boss)}
                                                onMouseLeave={() => setHoveredSlice(null)}
                                            />
                                            {isFullCircle && !hoveredSlice ? (
                                                <text
                                                    x={cx}
                                                    y={cy + 2}
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                    className="text-[9px] font-semibold fill-white pointer-events-none"
                                                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                                                >
                                                    {slice.percentage.toFixed(0)}%
                                                </text>
                                            ) : isLarge && !hoveredSlice && (
                                                <text
                                                    x={labelX}
                                                    y={labelY + 2}
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                    className="text-[9px] font-semibold fill-white pointer-events-none"
                                                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                                                >
                                                    {slice.percentage.toFixed(0)}%
                                                </text>
                                            )}
                                        </g>
                                    );
                                })}
                            </svg>
                            
                            {/* Tooltip */}
                            {hoveredSlice && (() => {
                                const hoveredData = allBossPercentages.find(b => b.boss === hoveredSlice);
                                if (!hoveredData) return null;
                                return (
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded px-3 py-2 shadow-lg z-10 pointer-events-none whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="font-semibold">{hoveredData.boss}</span>
                                            <span className="text-neutral-300 dark:text-neutral-600">
                                                {hoveredData.percentage.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
                                            {hoveredData.kills.toLocaleString()} kills
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 space-y-3 overflow-y-auto">
                        {allBossPercentages.map(({ boss, kills, percentage }) => (
                            <div key={boss} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="h-4 w-4 rounded"
                                            style={{ backgroundColor: getBossColor(boss) }}
                                        />
                                        <span className="font-medium">{boss}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold">{percentage.toFixed(1)}%</div>
                                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                                            {kills.toLocaleString()} kills
                                        </div>
                                    </div>
                                </div>
                                <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                                    <div
                                        className="h-full transition-all"
                                        style={{
                                            width: `${percentage}%`,
                                            backgroundColor: getBossColor(boss),
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                        {totalKills > 0 && (
                            <div className="pt-2 text-xs text-neutral-500 dark:text-neutral-400">
                                Total kills: {totalKills.toLocaleString()}
                            </div>
                        )}
                    </div>
                )
            ) : (
                chartType === 'pie' ? (
                    <div className="flex-1 flex items-center gap-4 overflow-hidden relative">
                        <div className="flex-shrink-0 space-y-1.5 py-2 max-h-full overflow-y-auto">
                        </div>
                        <div className="flex-1 flex items-center justify-end relative">
                            <svg viewBox="0 0 250 250" className="w-full max-w-[400px] h-auto">
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-neutral-500 dark:text-neutral-400 pointer-events-none">
                                <p className="text-sm">No boss kill data available</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 space-y-3 overflow-y-auto flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                        <p className="text-sm">No boss kill data available</p>
                    </div>
                )
            )}
        </div>
    );
}

