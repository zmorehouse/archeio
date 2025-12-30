import { Link } from '@inertiajs/react';
import { getSkillIconPath } from '@/lib/runescape-utils';

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

interface RecentActivityComponentProps {
    players: Player[];
    historicalStats?: Record<number, HistoricalStat[]>;
}

interface LevelUp {
    player: Player;
    skill: string;
    level: number;
    timestamp: Date;
}

export function RecentActivityComponent({ players, historicalStats = {} }: RecentActivityComponentProps) {
    // Find level ups by comparing consecutive stats
    const findLevelUps = (): LevelUp[] => {
        const levelUps: LevelUp[] = [];

        players.forEach(player => {
            const stats = historicalStats[player.id] || [];
            if (stats.length < 2) return;

            // Sort by date ascending
            const sortedStats = [...stats].sort((a, b) =>
                new Date(a.fetched_at).getTime() - new Date(b.fetched_at).getTime()
            );

            // Compare consecutive stats to find level ups
            for (let i = 1; i < sortedStats.length; i++) {
                const prev = sortedStats[i - 1];
                const curr = sortedStats[i];

                Object.keys(curr.skills || {}).forEach(skillName => {
                    if (skillName === 'Overall') return;

                    const prevLevel = prev.skills?.[skillName]?.level || 0;
                    const currLevel = curr.skills?.[skillName]?.level || 0;

                    if (currLevel > prevLevel) {
                        levelUps.push({
                            player,
                            skill: skillName,
                            level: currLevel,
                            timestamp: new Date(curr.fetched_at),
                        });
                    }
                });
            }
        });

        // Sort by timestamp descending (most recent first)
        levelUps.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        return levelUps.slice(0, 5); // Get 5 most recent
    };

    const recentLevelUps = findLevelUps();

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

    return (
        <div className="h-full">
            <h3 className="mb-3 text-lg font-semibold">Recent Activity</h3>
            
            {recentLevelUps.length > 0 ? (
                <div className="space-y-2">
                    {recentLevelUps.map((levelUp, index) => (
                        <div
                            key={index}
                            className="rounded-lg border border-sidebar-border/70 p-3 dark:border-sidebar-border"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <img
                                        src={getSkillIconPath(levelUp.skill)}
                                        alt={levelUp.skill}
                                        className="h-5 w-5"
                                    />
                                    <div>
                                        <Link
                                            href={`/players/${levelUp.player.name}`}
                                            className="font-medium text-primary hover:underline"
                                        >
                                            {levelUp.player.name}
                                        </Link>
                                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                            {levelUp.skill} → Level {levelUp.level}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                                    {formatTimeAgo(levelUp.timestamp)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex h-full items-center justify-center text-neutral-500 dark:text-neutral-400">
                    <p className="text-sm">No recent activity</p>
                </div>
            )}
        </div>
    );
}

