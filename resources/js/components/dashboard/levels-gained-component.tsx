import { useState, useMemo, useCallback } from 'react';
import { SKILL_ORDER, getSkillIconPath, getSkillColor } from '@/lib/runescape-utils';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { getStartOfTodaySydney } from '@/lib/timezone-utils';
import { createPortal } from 'react-dom';

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

interface LevelsGainedComponentProps {
    players: Player[];
    historicalStats?: Record<number, HistoricalStat[]>;
}

export function LevelsGainedComponent({ players, historicalStats = {} }: LevelsGainedComponentProps) {
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('weekly');
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [hoveredSegment, setHoveredSegment] = useState<{ playerId: number; skill: string; x: number; y: number } | null>(null);
    const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
    const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
    const [datePickerOpen, setDatePickerOpen] = useState(false);

    // Calculate total levels gained for each player
    const calculatePlayerTotalLevels = useCallback(() => {
        const playerLevelsData: Array<{
            player: Player;
            total: number;
        }> = [];

        const now = new Date();
        let cutoffDate: Date;
        if (period === 'custom' && customStartDate) {
            cutoffDate = customStartDate;
        } else if (period === 'yearly') {
            cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        } else if (period === 'monthly') {
            cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (period === 'weekly') {
            cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else {
            // Daily: start of today in Sydney timezone
            cutoffDate = getStartOfTodaySydney();
        }

        players.forEach(player => {
            const stats = historicalStats[player.id] || [];
            let total = 0;

            if (stats.length >= 2) {
                let recentStats = stats.filter(stat => new Date(stat.fetched_at) >= cutoffDate);
                
                // If custom period with end date, also filter by end date
                if (period === 'custom' && customEndDate) {
                    recentStats = recentStats.filter(stat => new Date(stat.fetched_at) <= customEndDate);
                }
                
                if (recentStats.length >= 2) {
                    const sortedStats = [...recentStats].sort((a, b) =>
                        new Date(a.fetched_at).getTime() - new Date(b.fetched_at).getTime()
                    );

                    const firstStat = sortedStats[0];
                    const lastStat = sortedStats[sortedStats.length - 1];
                    total = lastStat.overall_level - firstStat.overall_level;
                }
            }

            playerLevelsData.push({
                player,
                total: Math.max(0, total),
            });
        });

        return playerLevelsData.sort((a, b) => b.total - a.total);
    }, [players, historicalStats, period, customStartDate, customEndDate]);

    // Calculate levels gained per skill for each player (for breakdown view)
    const calculatePlayerLevelsBreakdown = useCallback(() => {
        const playerLevelsGained: Array<{
            player: Player;
            skills: Record<string, number>;
            total: number;
        }> = [];

        const now = new Date();
        let cutoffDate: Date;
        if (period === 'custom' && customStartDate) {
            cutoffDate = customStartDate;
        } else if (period === 'yearly') {
            cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        } else if (period === 'monthly') {
            cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (period === 'weekly') {
            cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else {
            // Daily: start of today in Sydney timezone
            cutoffDate = getStartOfTodaySydney();
        }

        players.forEach(player => {
            const stats = historicalStats[player.id] || [];
            const skills: Record<string, number> = {};
            let total = 0;

            if (stats.length >= 2) {
                let recentStats = stats.filter(stat => new Date(stat.fetched_at) >= cutoffDate);
                
                // If custom period with end date, also filter by end date
                if (period === 'custom' && customEndDate) {
                    recentStats = recentStats.filter(stat => new Date(stat.fetched_at) <= customEndDate);
                }
                
                if (recentStats.length >= 2) {
                    const sortedStats = [...recentStats].sort((a, b) =>
                        new Date(a.fetched_at).getTime() - new Date(b.fetched_at).getTime()
                    );

                    const firstStat = sortedStats[0];
                    const lastStat = sortedStats[sortedStats.length - 1];

                    SKILL_ORDER.forEach(skillName => {
                        if (skillName === 'Overall') return;

                        const firstLevel = firstStat.skills?.[skillName]?.level || 0;
                        const lastLevel = lastStat.skills?.[skillName]?.level || 0;
                        const levelsGained = lastLevel - firstLevel;

                        if (levelsGained > 0) {
                            skills[skillName] = levelsGained;
                            total += levelsGained;
                        }
                    });
                }
            }

            playerLevelsGained.push({
                player,
                skills,
                total,
            });
        });

        return playerLevelsGained.sort((a, b) => b.total - a.total);
    }, [players, historicalStats, period, customStartDate, customEndDate]);

    const playerLevelsData = useMemo(() => calculatePlayerTotalLevels(), [calculatePlayerTotalLevels]);
    const playerBreakdownData = useMemo(() => calculatePlayerLevelsBreakdown(), [calculatePlayerLevelsBreakdown]);
    const maxLevels = playerLevelsData.length > 0 ? Math.max(...playerLevelsData.map(d => d.total)) : 0;

    return (
        <div className="h-full flex flex-col">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold">Levels Gained</h3>
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
                        <button
                            onClick={() => setPeriod('yearly')}
                            className={`rounded px-3 py-1 text-xs transition-colors ${
                                period === 'yearly'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                            }`}
                        >
                            Yearly
                        </button>
                        <button
                            onClick={() => {
                                setPeriod('custom');
                                setDatePickerOpen(true);
                            }}
                            className={`rounded px-3 py-1 text-xs transition-colors ${
                                period === 'custom'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                            }`}
                        >
                            Custom
                        </button>
                    </div>
                    <span className="hidden sm:inline text-neutral-400 dark:text-neutral-600">|</span>
                    <button
                        onClick={() => setShowBreakdown(!showBreakdown)}
                        className={`rounded px-3 py-1 text-xs transition-colors ${
                            showBreakdown
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                        }`}
                    >
                        Breakdown
                    </button>
                </div>
            </div>

            {playerLevelsData.length > 0 ? (
                <div className="flex-1 space-y-3 overflow-y-auto overflow-x-auto">
                    {showBreakdown ? (
                        // Breakdown view: skill segments per player
                        playerBreakdownData.map(({ player, skills, total }) => {
                            const skillEntries = Object.entries(skills).sort((a, b) => b[1] - a[1]);
                            
                            return (
                                <div key={player.id} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{player.name}</span>
                                        <span className="font-semibold text-green-600 dark:text-green-400">
                                            +{total}
                                        </span>
                                    </div>
                                    <div className="h-6 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800 relative flex">
                                        {skillEntries.length > 0 ? (
                                            skillEntries.map(([skillName, levelsGained], index) => {
                                                const skillPercentage = total > 0 ? (levelsGained / total) * 100 : 0;
                                                const isHovered = hoveredSegment?.playerId === player.id && hoveredSegment?.skill === skillName;
                                                const showIcon = skillPercentage >= 8;
                                                
                                                return (
                                                    <div
                                                        key={skillName}
                                                        className="h-full transition-opacity relative flex items-center"
                                                        style={{
                                                            width: `${skillPercentage}%`,
                                                            backgroundColor: getSkillColor(skillName),
                                                            opacity: hoveredSegment && !isHovered ? 0.3 : 1,
                                                            minWidth: skillPercentage > 0 ? '2px' : '0',
                                                        }}
                                                        onMouseEnter={(e) => setHoveredSegment({ 
                                                            playerId: player.id, 
                                                            skill: skillName,
                                                            x: e.clientX,
                                                            y: e.clientY
                                                        })}
                                                        onMouseLeave={() => setHoveredSegment(null)}
                                                        onMouseMove={(e) => {
                                                            if (isHovered) {
                                                                setHoveredSegment({ 
                                                                    playerId: player.id, 
                                                                    skill: skillName,
                                                                    x: e.clientX,
                                                                    y: e.clientY
                                                                });
                                                            }
                                                        }}
                                                    >
                                                        {showIcon && (
                                                            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                                                <img
                                                                    src={getSkillIconPath(skillName)}
                                                                    alt={skillName}
                                                                    className="h-4 w-4"
                                                                    title={skillName}
                                                                />
                                                                <span className="text-xs font-medium text-white">
                                                                    +{levelsGained}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        // Normal view: total levels bars
                        playerLevelsData.map(({ player, total }) => {
                            const percentage = maxLevels > 0 ? (total / maxLevels) * 100 : 0;
                            const isHovered = hoveredSegment?.playerId === player.id;
                            
                            return (
                                <div key={player.id} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{player.name}</span>
                                        <span className="font-semibold text-green-600 dark:text-green-400">
                                            +{total}
                                        </span>
                                    </div>
                                    <div 
                                        className="h-6 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800 relative"
                                        onMouseEnter={() => setHoveredSegment({ playerId: player.id, skill: '' })}
                                        onMouseLeave={() => setHoveredSegment(null)}
                                    >
                                        <div
                                            className="h-full bg-primary transition-all"
                                            style={{ width: `${percentage}%` }}
                                        />
                                        {isHovered && (
                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 z-10 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded px-3 py-2 shadow-lg pointer-events-none whitespace-nowrap">
                                                <div className="text-xs font-semibold">
                                                    +{total} Levels
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            ) : (
                <div className="flex h-full items-center justify-center text-neutral-500 dark:text-neutral-400">
                    <p className="text-sm">No data available for {period === 'custom' && customStartDate && customEndDate 
                        ? `${customStartDate.toLocaleDateString()} - ${customEndDate.toLocaleDateString()}`
                        : period} period</p>
                </div>
            )}
            <DateRangePicker
                open={datePickerOpen}
                onOpenChange={setDatePickerOpen}
                startDate={customStartDate}
                endDate={customEndDate}
                onDateChange={(start, end) => {
                    setCustomStartDate(start);
                    setCustomEndDate(end);
                    if (start && end) {
                        setPeriod('custom');
                    }
                }}
            />

            {/* Tooltip Portal - renders above everything */}
            {hoveredSegment && hoveredSegment.skill && typeof document !== 'undefined' && createPortal(
                (() => {
                    const player = players.find(p => p.id === hoveredSegment.playerId);
                    const breakdown = playerBreakdownData.find(b => b.player.id === hoveredSegment.playerId);
                    if (!player || !breakdown) return null;
                    
                    const levelsGained = breakdown.skills[hoveredSegment.skill] || 0;
                    const total = breakdown.total;
                    const skillPercentage = total > 0 ? (levelsGained / total) * 100 : 0;
                    
                    return (
                        <div
                            className="fixed bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded px-3 py-2 shadow-lg text-xs pointer-events-none z-[9999]"
                            style={{
                                left: `${hoveredSegment.x}px`,
                                top: `${hoveredSegment.y}px`,
                                transform: 'translate(-50%, calc(-100% - 10px))',
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <img
                                    src={getSkillIconPath(hoveredSegment.skill)}
                                    alt={hoveredSegment.skill}
                                    className="h-4 w-4"
                                />
                                <span className="font-semibold">{hoveredSegment.skill}</span>
                                <span className="text-neutral-300 dark:text-neutral-600">
                                    {skillPercentage.toFixed(1)}%
                                </span>
                            </div>
                            <div className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
                                +{levelsGained} Levels
                            </div>
                        </div>
                    );
                })(),
                document.body
            )}
        </div>
    );
}
