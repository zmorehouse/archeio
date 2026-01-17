export interface ActivityEvent {
    id: string;
    type: 'level_gain' | 'xp_milestone' | 'total_level_milestone' | 'boss_kill';
    playerId: number;
    playerName: string;
    timestamp: Date;
    description: string;
    skill?: string;
    level?: number;
    xp?: number;
    totalLevel?: number;
    bossName?: string;
}

interface HistoricalStat {
    fetched_at: string;
    overall_experience: number;
    overall_level: number;
    skills: Record<string, { rank: number; level: number; experience: number }>;
    activities?: Record<string, { rank: number; score: number }>;
}

interface Player {
    id: number;
    name: string;
}

/**
 * Detects significant events from historical stats
 * This is a reusable function that can be used for global or player-specific activity logs
 */
export function detectActivityEvents(
    players: Player[],
    historicalStats: Record<number, HistoricalStat[]>
): ActivityEvent[] {
    const events: ActivityEvent[] = [];

    players.forEach(player => {
        const stats = historicalStats[player.id];
        // Ensure stats is an array
        if (!Array.isArray(stats) || stats.length < 2) return;

        // Sort stats by date
        const sortedStats = [...stats].sort((a, b) =>
            new Date(a.fetched_at).getTime() - new Date(b.fetched_at).getTime()
        );

        // Track previous values to detect changes
        let previousStat: HistoricalStat | null = null;

        sortedStats.forEach((currentStat) => {
            if (previousStat) {
                const currentDate = new Date(currentStat.fetched_at);

                // Detect level gains in skills
                Object.keys(currentStat.skills).forEach(skillName => {
                    if (skillName === 'Overall') return;
                    
                    const currentLevel = currentStat.skills[skillName]?.level || 0;
                    const previousLevel = previousStat.skills[skillName]?.level || 0;

                    if (currentLevel > previousLevel) {
                        events.push({
                            id: `${player.id}-${skillName}-${currentLevel}-${currentDate.getTime()}`,
                            type: 'level_gain',
                            playerId: player.id,
                            playerName: player.name,
                            timestamp: currentDate,
                            description: `Gained level ${currentLevel} in ${skillName}`,
                            skill: skillName,
                            level: currentLevel,
                        });
                    }
                });

                // Detect total XP milestones (1mil increments)
                const currentXP = currentStat.overall_experience;
                const previousXP = previousStat.overall_experience;
                
                const currentMilestone = Math.floor(currentXP / 1_000_000);
                const previousMilestone = Math.floor(previousXP / 1_000_000);

                if (currentMilestone > previousMilestone && currentMilestone >= 1) {
                    events.push({
                        id: `${player.id}-xp-milestone-${currentMilestone}-${currentDate.getTime()}`,
                        type: 'xp_milestone',
                        playerId: player.id,
                        playerName: player.name,
                        timestamp: currentDate,
                        description: `Reached ${currentMilestone}M total XP`,
                        xp: currentXP,
                    });
                }

                // Detect notable total level milestones (by 50s: 1850, 1900, 1950, 2000, 2050, 2100, 2150, etc.)
                const currentTotalLevel = currentStat.overall_level;
                const previousTotalLevel = previousStat.overall_level;

                // Check if crossed a 50-level milestone (1850, 1900, 1950, etc.)
                const currentMilestoneLevel = Math.floor(currentTotalLevel / 50) * 50;
                const previousMilestoneLevel = Math.floor(previousTotalLevel / 50) * 50;

                // Only track milestones >= 1850
                if (currentMilestoneLevel > previousMilestoneLevel && currentMilestoneLevel >= 1850) {
                    events.push({
                        id: `${player.id}-total-level-${currentMilestoneLevel}-${currentDate.getTime()}`,
                        type: 'total_level_milestone',
                        playerId: player.id,
                        playerName: player.name,
                        timestamp: currentDate,
                        description: `Reached ${currentMilestoneLevel} total level`,
                        totalLevel: currentMilestoneLevel,
                    });
                }

                // Detect boss kills
                const currentActivities = currentStat.activities || {};
                const previousActivities = previousStat.activities || {};

                // Check for boss activities that have increased
                Object.keys(currentActivities).forEach(activityName => {
                    const currentScore = currentActivities[activityName]?.score || 0;
                    const previousScore = previousActivities[activityName]?.score || 0;

                    if (currentScore > previousScore) {
                        // Check if this is a boss activity
                        const isBoss = activityName.toLowerCase().includes('boss') ||
                            activityName.toLowerCase().includes('kill') ||
                            activityName.toLowerCase().includes('chest') ||
                            activityName.toLowerCase().includes('chambers') ||
                            activityName.toLowerCase().includes('theatre') ||
                            activityName.toLowerCase().includes('inferno') ||
                            activityName.toLowerCase().includes('gauntlet') ||
                            activityName.toLowerCase().includes('nightmare') ||
                            activityName.toLowerCase().includes('nex') ||
                            activityName.toLowerCase().includes('zulrah') ||
                            activityName.toLowerCase().includes('vorkath') ||
                            activityName.toLowerCase().includes('cerberus') ||
                            activityName.toLowerCase().includes('kraken') ||
                            activityName.toLowerCase().includes('sire') ||
                            activityName.toLowerCase().includes('hydra') ||
                            activityName.toLowerCase().includes('barrows') ||
                            activityName.toLowerCase().includes('corp') ||
                            activityName.toLowerCase().includes('zilyana') ||
                            activityName.toLowerCase().includes('bandos') ||
                            activityName.toLowerCase().includes('armadyl') ||
                            activityName.toLowerCase().includes('saradomin') ||
                            activityName.toLowerCase().includes('zamorak');

                        if (isBoss) {
                            const killCount = currentScore - previousScore;
                            // Format boss name (capitalize first letter of each word)
                            const bossName = activityName
                                .split(/\s+/)
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                .join(' ');

                            events.push({
                                id: `${player.id}-boss-kill-${activityName}-${currentDate.getTime()}`,
                                type: 'boss_kill',
                                playerId: player.id,
                                playerName: player.name,
                                timestamp: currentDate,
                                description: killCount === 1 
                                    ? `killed ${bossName}` 
                                    : `killed ${bossName} ${killCount} times`,
                                bossName: bossName,
                            });
                        }
                    }
                });
            }

            previousStat = currentStat;
        });
    });

    // Sort by timestamp (most recent first)
    // Note: We don't limit here - let the caller decide how many they want
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

