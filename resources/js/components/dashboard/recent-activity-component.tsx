import { Link } from '@inertiajs/react';
import { getSkillIconPath } from '@/lib/runescape-utils';
import { detectActivityEvents, ActivityEvent } from '@/lib/activity-detector';
import { useMemo } from 'react';
import { Sword } from 'lucide-react';

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
    activities?: Record<string, { rank: number; score: number }>;
}

interface RecentActivityComponentProps {
    players: Player[];
    historicalStats?: Record<number, HistoricalStat[]>;
}

export function RecentActivityComponent({ players, historicalStats = {} }: RecentActivityComponentProps) {
    // Get all activity events (level ups, milestones, boss kills)
    const activityEvents = useMemo(() => {
        // Ensure historicalStats is an object and all values are arrays
        const safeHistoricalStats: Record<number, Array<{
            fetched_at: string;
            overall_experience: number;
            overall_level: number;
            skills: Record<string, { rank: number; level: number; experience: number }>;
            activities?: Record<string, { rank: number; score: number }>;
        }>> = {};
        
        // Check if historicalStats exists and is an object
        if (historicalStats && typeof historicalStats === 'object' && !Array.isArray(historicalStats)) {
            Object.keys(historicalStats).forEach(key => {
                const playerId = Number(key);
                if (!isNaN(playerId)) {
                    const stats = historicalStats[playerId];
                    if (Array.isArray(stats) && stats.length > 0) {
                        safeHistoricalStats[playerId] = stats;
                    }
                }
            });
        }
        
        // Get all events for all players
        if (players.length > 0 && Object.keys(safeHistoricalStats).length > 0) {
            return detectActivityEvents(players, safeHistoricalStats)
                .slice(0, 5); // Get 5 most recent
        }
        
        return [];
    }, [players, historicalStats]);

    const formatTimeAgo = (date: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    const getEventIcon = (event: ActivityEvent) => {
        if (event.type === 'boss_kill') {
            return <Sword className="h-5 w-5" />;
        }
        if (event.type === 'level_gain' && event.skill) {
            return (
                <img
                    src={getSkillIconPath(event.skill)}
                    alt={event.skill}
                    className="h-5 w-5"
                />
            );
        }
        return null;
    };

    const getEventColor = (event: ActivityEvent) => {
        if (event.type === 'boss_kill') {
            return 'text-red-600 dark:text-red-400';
        }
        return 'text-neutral-600 dark:text-neutral-400';
    };

    const getEventDescription = (event: ActivityEvent) => {
        if (event.type === 'level_gain') {
            return `${event.skill} → Level ${event.level}`;
        }
        return event.description;
    };

    return (
        <div className="h-full">
            <h3 className="mb-3 text-lg font-semibold">Recent Activity</h3>
            
            {activityEvents.length > 0 ? (
                <div className="space-y-2">
                    {activityEvents.map((event) => {
                        const player = players.find(p => p.id === event.playerId);
                        if (!player) return null;

                        return (
                            <div
                                key={event.id}
                                className="rounded-lg border border-sidebar-border/70 p-3 dark:border-sidebar-border"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={getEventColor(event)}>
                                            {getEventIcon(event)}
                                        </div>
                                        <div>
                                            <Link
                                                href={`/players/${player.name}`}
                                                className="font-medium text-primary hover:underline"
                                            >
                                                {player.name}
                                            </Link>
                                            <div className={`text-sm ${getEventColor(event)}`}>
                                                {getEventDescription(event)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                                        {formatTimeAgo(event.timestamp)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex h-full items-center justify-center text-neutral-500 dark:text-neutral-400">
                    <p className="text-sm">No recent activity</p>
                </div>
            )}
        </div>
    );
}

