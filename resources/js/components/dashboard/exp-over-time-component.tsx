import { formatXP } from '@/lib/runescape-utils';
import { useState } from 'react';

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

interface ExpOverTimeComponentProps {
    players: Player[];
    historicalStats?: Record<number, HistoricalStat[]>;
}

export function ExpOverTimeComponent({ players, historicalStats = {} }: ExpOverTimeComponentProps) {
    const [selectedPlayers, setSelectedPlayers] = useState<Set<number>>(
        new Set(players.map((p) => p.id)),
    );
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

    const togglePlayer = (playerId: number) => {
        const newSet = new Set(selectedPlayers);
        if (newSet.has(playerId)) {
            newSet.delete(playerId);
        } else {
            newSet.add(playerId);
        }
        setSelectedPlayers(newSet);
    };

    // Filter historical data based on time range
    const getFilteredData = () => {
        const now = new Date();
        let cutoffDate: Date;
        
        switch (timeRange) {
            case '7d':
                cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                cutoffDate = new Date(0);
        }

        const filtered: Record<number, HistoricalStat[]> = {};
        
        Object.entries(historicalStats).forEach(([playerId, stats]) => {
            const playerIdNum = parseInt(playerId);
            if (!selectedPlayers.has(playerIdNum)) return;
            
            const playerStats = stats.filter(stat => {
                const statDate = new Date(stat.fetched_at);
                return statDate >= cutoffDate;
            });
            
            if (playerStats.length > 0) {
                filtered[playerIdNum] = playerStats;
            }
        });
        
        return filtered;
    };

    const filteredData = getFilteredData();
    const hasData = Object.keys(filteredData).length > 0;

    return (
        <div className="h-full flex flex-col">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold">EXP Over Time</h3>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
                <button
                    onClick={() => setTimeRange('7d')}
                    className={`rounded px-3 py-1 text-xs ${
                        timeRange === '7d'
                            ? 'bg-primary text-white'
                            : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                    }`}
                >
                    7 Days
                </button>
                <button
                    onClick={() => setTimeRange('30d')}
                    className={`rounded px-3 py-1 text-xs ${
                        timeRange === '30d'
                            ? 'bg-primary text-white'
                            : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                    }`}
                >
                    30 Days
                </button>
                <button
                    onClick={() => setTimeRange('90d')}
                    className={`rounded px-3 py-1 text-xs ${
                        timeRange === '90d'
                            ? 'bg-primary text-white'
                            : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                    }`}
                >
                    90 Days
                </button>
                <button
                    onClick={() => setTimeRange('all')}
                    className={`rounded px-3 py-1 text-xs ${
                        timeRange === 'all'
                            ? 'bg-primary text-white'
                            : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                    }`}
                >
                    All Time
                </button>
            </div>

            <div className="mb-4 space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Toggle Players
                </div>
                {players.map((player) => (
                    <label
                        key={player.id}
                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                        <input
                            type="checkbox"
                            checked={selectedPlayers.has(player.id)}
                            onChange={() => togglePlayer(player.id)}
                            className="h-4 w-4"
                        />
                        <span className="text-sm">{player.name}</span>
                    </label>
                ))}
            </div>

            <div className="flex-1 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                {hasData ? (
                    <div className="h-full space-y-4 overflow-y-auto">
                        {Object.entries(filteredData).map(([playerId, stats]) => {
                            const player = players.find(p => p.id === parseInt(playerId));
                            if (!player || stats.length === 0) return null;

                            const firstStat = stats[0];
                            const lastStat = stats[stats.length - 1];
                            const xpGained = lastStat.overall_experience - firstStat.overall_experience;
                            const levelGained = lastStat.overall_level - firstStat.overall_level;

                            return (
                                <div key={playerId} className="rounded-lg border border-sidebar-border/50 p-3 dark:border-sidebar-border">
                                    <div className="mb-2 font-medium">{player.name}</div>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-neutral-500 dark:text-neutral-400">XP Gained:</span>
                                            <span className="font-semibold text-green-600 dark:text-green-400">
                                                +{formatXP(xpGained)}
                                            </span>
                                        </div>
                                        {levelGained > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-neutral-500 dark:text-neutral-400">Levels Gained:</span>
                                                <span className="font-semibold text-blue-600 dark:text-blue-400">
                                                    +{levelGained}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                                            <span>{stats.length} data points</span>
                                            <span>
                                                {new Date(firstStat.fetched_at).toLocaleDateString()} - {new Date(lastStat.fetched_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center text-neutral-500 dark:text-neutral-400">
                        <div className="text-center">
                            <p className="text-sm">No historical data available for selected players</p>
                            <p className="mt-1 text-xs">Data will appear as stats are collected</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

