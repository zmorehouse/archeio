import { formatNumber, formatXP, NON_COMBAT_SKILLS, COMBAT_SKILLS, xpForNextLevel } from '@/lib/runescape-utils';

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

interface GeneralStatsComponentProps {
    players: Player[];
}

type NextLevelInfo = {
    player: Player;
    skill: string;
    xpRemaining: number;
    level: number;
};

export function GeneralStatsComponent({ players }: GeneralStatsComponentProps) {
    // Find closest to next level
    let closestPlayer: NextLevelInfo | null = null;
    let minXpRemaining = Infinity;

    players.forEach((player) => {
        Object.entries(player.skills || {}).forEach(([skillName, skill]) => {
            if (skillName === 'Overall' || skill.level >= 99) return;
            const xpRemaining = xpForNextLevel(skill.experience);
            if (xpRemaining < minXpRemaining) {
                minXpRemaining = xpRemaining;
                closestPlayer = {
                    player,
                    skill: skillName,
                    xpRemaining,
                    level: skill.level + 1,
                };
            }
        });
    });

    // Find biggest grind
    let biggestGrind: NextLevelInfo | null = null;
    let maxXpRemaining = 0;

    players.forEach((player) => {
        Object.entries(player.skills || {}).forEach(([skillName, skill]) => {
            if (skillName === 'Overall' || skill.level >= 99) return;
            const xpRemaining = xpForNextLevel(skill.experience);
            if (xpRemaining > maxXpRemaining) {
                maxXpRemaining = xpRemaining;
                biggestGrind = {
                    player,
                    skill: skillName,
                    xpRemaining,
                    level: skill.level + 1,
                };
            }
        });
    });

    // Calculate combat XP totals
    const combatTotals = players.map((player) => {
        const combatXP = COMBAT_SKILLS.reduce((total, skillName) => {
            return total + (player.skills?.[skillName]?.experience || 0);
        }, 0);
        return { player, combatXP };
    });
    combatTotals.sort((a, b) => b.combatXP - a.combatXP);
    const mostCombat = combatTotals[0];

    // Calculate non-combat XP totals
    const nonCombatTotals = players.map((player) => {
        const nonCombatXP = NON_COMBAT_SKILLS.reduce((total, skillName) => {
            return total + (player.skills?.[skillName]?.experience || 0);
        }, 0);
        return { player, nonCombatXP };
    });
    nonCombatTotals.sort((a, b) => b.nonCombatXP - a.nonCombatXP);
    const topSkiller = nonCombatTotals[0];

    // Calculate average skill levels (excluding Overall)
    const avgLevels = players.map((player) => {
        const skills = Object.entries(player.skills || {}).filter(([name]) => name !== 'Overall');
        const totalLevel = skills.reduce((sum, [, skill]) => sum + (skill?.level || 0), 0);
        const avgLevel = skills.length > 0 ? totalLevel / skills.length : 0;
        return { player, avgLevel };
    });
    avgLevels.sort((a, b) => b.avgLevel - a.avgLevel);
    const highestAvg = avgLevels[0];

    // Calculate total XP difference between top 2 players
    const overallTotals = players
        .map((player) => ({
            player,
            totalXP: player.skills?.Overall?.experience || 0,
        }))
        .sort((a, b) => b.totalXP - a.totalXP);
    const xpDifference = overallTotals.length >= 2
        ? overallTotals[0].totalXP - overallTotals[1].totalXP
        : 0;
    const leader = overallTotals[0];
    const second = overallTotals[1];

    // Calculate combined totals
    const combinedLevels = players.reduce((sum, player) => {
        return sum + (player.skills?.Overall?.level || 0);
    }, 0);

    const combinedXP = players.reduce((sum, player) => {
        return sum + (player.skills?.Overall?.experience || 0);
    }, 0);

    const stats: Array<{ label: string; value: string }> = [];

    if (closestPlayer) {
        const cp: NextLevelInfo = closestPlayer;
        stats.push({
            label: 'Closest to Next Level',
            value: `${cp.player.name} is the closest to their next level up, with ${formatXP(cp.xpRemaining)} XP remaining to level ${cp.level} ${cp.skill}!`,
        });
    }

    if (biggestGrind) {
        const bg: NextLevelInfo = biggestGrind;
        stats.push({
            label: 'Biggest Grind',
            value: `${bg.player.name} has the biggest grind ahead, needing ${formatXP(bg.xpRemaining)} XP to level ${bg.level} ${bg.skill}.`,
        });
    }

    if (mostCombat) {
        stats.push({
            label: 'Most Combat XP',
            value: `${mostCombat.player.name} is the most combat-proficient, having ${formatXP(mostCombat.combatXP)} combat XP`,
        });
    }

    if (topSkiller) {
        stats.push({
            label: 'Top Skiller',
            value: `${topSkiller.player.name} is the top skiller, having ${formatXP(topSkiller.nonCombatXP)} non-combat XP.`,
        });
    }

    if (highestAvg) {
        stats.push({
            label: 'Highest Average Level',
            value: `${highestAvg.player.name} has the highest average skill level at ${highestAvg.avgLevel.toFixed(2)}.`,
        });
    }


    return (
        <div className="h-full">
            <h3 className="mb-3 text-lg font-semibold">General Stats</h3>
            <div className="space-y-4">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="rounded-lg border border-sidebar-border/70 p-3 dark:border-sidebar-border"
                    >
                        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                            {stat.label}
                        </div>
                        <div className="mt-1 text-sm">{stat.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

