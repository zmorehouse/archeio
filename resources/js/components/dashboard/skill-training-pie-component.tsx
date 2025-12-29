import { getSkillIconPath, SKILL_ORDER, getSkillColor } from '@/lib/runescape-utils';
import { useState, useMemo, useCallback } from 'react';
import { getStartOfTodaySydney } from '@/lib/timezone-utils';

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

interface SkillTrainingPieComponentProps {
    players: Player[];
    historicalStats?: Record<number, HistoricalStat[]>;
}

// Helper function to generate pie chart paths
function createPieSlice(cx: number, cy: number, radius: number, startAngle: number, endAngle: number): string {
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

export function SkillTrainingPieComponent({ players, historicalStats = {} }: SkillTrainingPieComponentProps) {
    const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
    const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
    
    // Calculate XP gained per skill across all players
    const calculateSkillXpGained = useCallback(() => {
        const skillXpGained: Record<string, number> = {};
        
        const now = new Date();
        const cutoffDate = period === 'monthly'
            ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            : period === 'weekly'
            ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            : getStartOfTodaySydney(); // Daily: start of today in Sydney timezone
        
        players.forEach(player => {
            const stats = historicalStats[player.id] || [];
            if (stats.length < 2) return;

            // Filter stats within the period
            const recentStats = stats.filter(stat => new Date(stat.fetched_at) >= cutoffDate);
            if (recentStats.length < 2) return;

            // Sort by date
            const sortedStats = [...recentStats].sort((a, b) => 
                new Date(a.fetched_at).getTime() - new Date(b.fetched_at).getTime()
            );

            const firstStat = sortedStats[0];
            const lastStat = sortedStats[sortedStats.length - 1];

            SKILL_ORDER.forEach(skillName => {
                if (skillName === 'Overall') return;
                
                const firstXP = firstStat.skills?.[skillName]?.experience || 0;
                const lastXP = lastStat.skills?.[skillName]?.experience || 0;
                const xpGained = lastXP - firstXP;

                if (xpGained > 0) {
                    skillXpGained[skillName] = (skillXpGained[skillName] || 0) + xpGained;
                }
            });
        });

        return skillXpGained;
    }, [players, historicalStats, period]);

    const skillXpGained = useMemo(() => calculateSkillXpGained(), [calculateSkillXpGained]);
    const totalXp = Object.values(skillXpGained).reduce((sum, xp) => sum + xp, 0);

    // All skills for pie chart
    const allSkillPercentages = useMemo(() => {
        return Object.entries(skillXpGained)
            .map(([skill, xp]) => ({
                skill,
                xp,
                percentage: totalXp > 0 ? (xp / totalXp) * 100 : 0,
            }))
            .sort((a, b) => b.xp - a.xp);
    }, [skillXpGained, totalXp]);

    // Top 16 for legend
    const skillPercentages = useMemo(() => {
        return allSkillPercentages.slice(0, 16);
    }, [allSkillPercentages]);

    // Calculate pie chart slices - use ALL skills, not just top 10/15
    const pieSlices = useMemo(() => {
        if (allSkillPercentages.length === 0 || totalXp === 0) return [];
        
        let currentAngle = 0;
        return allSkillPercentages.map((item) => {
            const sliceAngle = (item.percentage / 100) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + sliceAngle;
            currentAngle = endAngle;
            
            return {
                ...item,
                startAngle,
                endAngle,
                color: getSkillColor(item.skill),
            };
        });
    }, [allSkillPercentages, totalXp]);

    const cx = 125;
    const cy = 125;
    const radius = 100;

    return (
        <div className="h-full flex flex-col">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold">Skill Training Distribution</h3>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex gap-1 flex-wrap">
                        <button
                            onClick={() => setPeriod('daily')}
                            className={`rounded px-3 py-1 text-xs transition-colors ${
                                period === 'daily'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                            }`}
                        >
                            Daily
                        </button>
                        <button
                            onClick={() => setPeriod('weekly')}
                            className={`rounded px-3 py-1 text-xs transition-colors ${
                                period === 'weekly'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                            }`}
                        >
                            Weekly
                        </button>
                        <button
                            onClick={() => setPeriod('monthly')}
                            className={`rounded px-3 py-1 text-xs transition-colors ${
                                period === 'monthly'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                            }`}
                        >
                            Monthly
                        </button>
                    </div>
                    <span className="hidden sm:inline text-neutral-400 dark:text-neutral-600">|</span>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setChartType('pie')}
                            className={`rounded px-3 py-1 text-xs transition-colors ${
                                chartType === 'pie'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                            }`}
                        >
                            Pie
                        </button>
                        <button
                            onClick={() => setChartType('bar')}
                            className={`rounded px-3 py-1 text-xs transition-colors ${
                                chartType === 'bar'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                            }`}
                        >
                            Bar
                        </button>
                    </div>
                </div>
            </div>
            
            {skillPercentages.length > 0 ? (
                chartType === 'pie' ? (
                    <div className="flex-1 flex items-center gap-4 overflow-hidden relative">
                        {/* Left-side legend for top 16 */}
                        <div className="flex-shrink-0 space-y-1.5 py-2 max-h-full overflow-y-auto">
                            {skillPercentages.map(({ skill, xp, percentage }, index) => {
                                const isHovered = hoveredSlice === skill;
                                return (
                                    <div
                                        key={skill}
                                        className={`flex items-center gap-2 text-xs cursor-pointer transition-opacity ${
                                            isHovered ? 'opacity-100' : hoveredSlice ? 'opacity-40' : 'opacity-100'
                                        }`}
                                        onMouseEnter={() => setHoveredSlice(skill)}
                                        onMouseLeave={() => setHoveredSlice(null)}
                                    >
                                        <div
                                            className="h-3 w-3 rounded flex-shrink-0"
                                            style={{ backgroundColor: getSkillColor(skill) }}
                                        />
                                        <img
                                            src={getSkillIconPath(skill)}
                                            alt={skill}
                                            className="h-3 w-3 flex-shrink-0"
                                        />
                                        <span className="font-medium truncate min-w-0">{skill}</span>
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
                                {pieSlices.map((slice, index) => {
                                    const isHovered = hoveredSlice === slice.skill;
                                    const isLarge = index < 2 && slice.percentage > 5; // Show text on top 2 if > 5%
                                    const midAngle = (slice.startAngle + slice.endAngle) / 2;
                                    const labelRadius = radius * 0.7;
                                    const labelX = cx + labelRadius * Math.cos((midAngle - 90) * Math.PI / 180);
                                    const labelY = cy + labelRadius * Math.sin((midAngle - 90) * Math.PI / 180);
                                    
                                    return (
                                        <g key={slice.skill}>
                                            <path
                                                d={createPieSlice(cx, cy, radius, slice.startAngle, slice.endAngle)}
                                                fill={slice.color}
                                                stroke="white"
                                                strokeWidth="2"
                                                style={{ 
                                                    opacity: isHovered ? 1 : hoveredSlice ? 0.3 : 1,
                                                    cursor: 'pointer',
                                                    transition: 'opacity 0.2s'
                                                }}
                                                onMouseEnter={() => setHoveredSlice(slice.skill)}
                                                onMouseLeave={() => setHoveredSlice(null)}
                                            />
                                            {isLarge && !hoveredSlice && (
                                                <>
                                                    <image
                                                        href={getSkillIconPath(slice.skill)}
                                                        x={labelX - 6}
                                                        y={labelY - 10}
                                                        width="12"
                                                        height="12"
                                                        className="pointer-events-none"
                                                    />
                                                    <text
                                                        x={labelX}
                                                        y={labelY + 6}
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                        className="text-[9px] font-semibold fill-white pointer-events-none"
                                                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                                                    >
                                                        {slice.percentage.toFixed(0)}%
                                                    </text>
                                                </>
                                            )}
                                        </g>
                                    );
                                })}
                            </svg>
                            
                            {/* Tooltip */}
                            {hoveredSlice && (() => {
                                const hoveredData = allSkillPercentages.find(s => s.skill === hoveredSlice);
                                if (!hoveredData) return null;
                                const index = skillPercentages.findIndex(s => s.skill === hoveredSlice);
                                return (
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded px-3 py-2 shadow-lg z-10 pointer-events-none whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-xs">
                                            <img
                                                src={getSkillIconPath(hoveredData.skill)}
                                                alt={hoveredData.skill}
                                                className="h-4 w-4"
                                            />
                                            <span className="font-semibold">{hoveredData.skill}</span>
                                            <span className="text-neutral-300 dark:text-neutral-600">
                                                {hoveredData.percentage.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
                                            {hoveredData.xp.toLocaleString()} XP
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 space-y-3 overflow-y-auto">
                        {allSkillPercentages.map(({ skill, xp, percentage }, index) => (
                            <div key={skill} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <img
                                            src={getSkillIconPath(skill)}
                                            alt={skill}
                                            className="h-4 w-4"
                                        />
                                        <span className="font-medium">{skill}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold">{percentage.toFixed(1)}%</div>
                                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                                            {xp.toLocaleString()} XP
                                        </div>
                                    </div>
                                </div>
                                <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                                    <div
                                        className="h-full transition-all"
                                        style={{
                                            width: `${percentage}%`,
                                            backgroundColor: getSkillColor(skill),
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                        {totalXp > 0 && (
                            <div className="pt-2 text-xs text-neutral-500 dark:text-neutral-400">
                                Total XP tracked: {totalXp.toLocaleString()}
                            </div>
                        )}
                    </div>
                )
            ) : (
                <div className="flex h-full items-center justify-center text-neutral-500 dark:text-neutral-400">
                    <p className="text-sm">No training data available</p>
                </div>
            )}
        </div>
    );
}

