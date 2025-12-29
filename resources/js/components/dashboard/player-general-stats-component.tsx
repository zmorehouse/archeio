import { formatXP, getSkillIconPath, SKILL_ORDER, xpForNextLevel, xpToReachLevel, COMBAT_SKILLS } from '@/lib/runescape-utils';

interface Skill {
    rank: number;
    level: number;
    experience: number;
}

interface Activity {
    rank: number;
    score: number;
}

interface PlayerGeneralStatsComponentProps {
    skills: Record<string, Skill>;
    activities?: Record<string, Activity>;
    historicalStats?: Array<{
        fetched_at: string;
        overall_experience: number;
        overall_level: number;
        skills: Record<string, Skill>;
    }>;
}

export function PlayerGeneralStatsComponent({ skills, activities = {}, historicalStats = [] }: PlayerGeneralStatsComponentProps) {
    // Find closest to next level
    let closestNextLevel: { skill: string; currentLevel: number; nextLevel: number; xpRemaining: number } | null = null;
    let minXpRemaining = Infinity;

    Object.entries(skills).forEach(([skillName, skill]) => {
        if (skillName === 'Overall' || skill.level >= 99) return;
        const xpRemaining = xpForNextLevel(skill.experience);
        if (xpRemaining < minXpRemaining) {
            minXpRemaining = xpRemaining;
            closestNextLevel = {
                skill: skillName,
                currentLevel: skill.level,
                nextLevel: skill.level + 1,
                xpRemaining,
            };
        }
    });

    // Find furthest grind
    let furthestGrind: { skill: string; currentLevel: number; nextLevel: number; xpRemaining: number } | null = null;
    let maxXpRemaining = 0;

    Object.entries(skills).forEach(([skillName, skill]) => {
        if (skillName === 'Overall' || skill.level >= 99) return;
        const xpRemaining = xpForNextLevel(skill.experience);
        if (xpRemaining > maxXpRemaining) {
            maxXpRemaining = xpRemaining;
            furthestGrind = {
                skill: skillName,
                currentLevel: skill.level,
                nextLevel: skill.level + 1,
                xpRemaining,
            };
        }
    });

    // Count number of 99s
    const numberOf99s = Object.entries(skills).filter(([skillName, skill]) => 
        skillName !== 'Overall' && skill.level >= 99
    ).length;

    // Find lowest skill level
    let lowestSkill: { name: string; level: number } | null = null;
    let minLevel = 999;

    Object.entries(skills).forEach(([skillName, skill]) => {
        if (skillName === 'Overall') return;
        if (skill.level < minLevel) {
            minLevel = skill.level;
            lowestSkill = { name: skillName, level: skill.level };
        }
    });

    // Find most killed boss (highest score in activities)
    let mostKilledBoss: { name: string; score: number } | null = null;
    let maxBossScore = 0;

    Object.entries(activities).forEach(([activityName, activity]) => {
        // Filter for boss activities (common boss names or activities with "kill" in them)
        // Also check for common boss patterns
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

        if (isBoss && activity.score > maxBossScore) {
            maxBossScore = activity.score;
            mostKilledBoss = { name: activityName, score: activity.score };
        }
    });

    // Find skills closest to 99
    const skillsTo99 = Object.entries(skills)
        .filter(([skillName, skill]) => skillName !== 'Overall' && skill.level < 99)
        .map(([skillName, skill]) => ({
            name: skillName,
            level: skill.level,
            xpTo99: xpToReachLevel(skill.experience, 99),
        }))
        .sort((a, b) => a.xpTo99 - b.xpTo99)
        .slice(0, 5);

    // Calculate combat level
    const combatLevel = (() => {
        if (!skills.Attack || !skills.Strength || !skills.Defence || !skills.Hitpoints || 
            !skills.Ranged || !skills.Prayer || !skills.Magic) {
            return null;
        }
        const base = 0.25 * (skills.Defence.level + skills.Hitpoints.level + Math.floor(skills.Prayer.level / 2));
        const melee = 0.325 * (skills.Attack.level + skills.Strength.level);
        const ranged = 0.325 * (Math.floor(skills.Ranged.level / 2) + skills.Ranged.level);
        const magic = 0.325 * (Math.floor(skills.Magic.level / 2) + skills.Magic.level);
        return Math.floor(base + Math.max(melee, ranged, magic));
    })();

    const stats: Array<{ label: string; value: string | React.ReactNode }> = [];

    if (closestNextLevel) {
        stats.push({
            label: 'Next Level',
            value: (
                <div className="flex items-center gap-2">
                    <img
                        src={getSkillIconPath(closestNextLevel.skill)}
                        alt={closestNextLevel.skill}
                        className="h-4 w-4"
                    />
                    <span>
                        {closestNextLevel.skill} {closestNextLevel.currentLevel} → {closestNextLevel.nextLevel}
                    </span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                        ({formatXP(closestNextLevel.xpRemaining)} remaining)
                    </span>
                </div>
            ),
        });
    }

    if (furthestGrind) {
        stats.push({
            label: 'Furthest Grind',
            value: (
                <div className="flex items-center gap-2">
                    <img
                        src={getSkillIconPath(furthestGrind.skill)}
                        alt={furthestGrind.skill}
                        className="h-4 w-4"
                    />
                    <span>
                        {furthestGrind.skill} {furthestGrind.currentLevel} → {furthestGrind.nextLevel}
                    </span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                        ({formatXP(furthestGrind.xpRemaining)} remaining)
                    </span>
                </div>
            ),
        });
    }

    stats.push({
        label: 'Number of 99s',
        value: (
            <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                {numberOf99s} / {SKILL_ORDER.length - 1}
            </span>
        ),
    });


    if (lowestSkill && lowestSkill.level < 50) {
        stats.push({
            label: 'Lowest Skill',
            value: (
                <div className="flex items-center gap-2">
                    <img
                        src={getSkillIconPath(lowestSkill.name)}
                        alt={lowestSkill.name}
                        className="h-4 w-4"
                    />
                    <span>
                        {lowestSkill.name} <span className="font-semibold text-orange-600 dark:text-orange-400">{lowestSkill.level}</span>
                    </span>
                </div>
            ),
        });
    }

    if (mostKilledBoss) {
        stats.push({
            label: 'Most Killed Boss',
            value: (
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-red-600 dark:text-red-400">
                        {mostKilledBoss.name}
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        ({mostKilledBoss.score.toLocaleString()} kills)
                    </span>
                </div>
            ),
        });
    }

    if (skillsTo99.length > 0) {
        stats.push({
            label: 'Closest to 99',
            value: (
                <div className="space-y-1">
                    {skillsTo99.map((skill) => (
                        <div key={skill.name} className="flex items-center gap-2 text-xs">
                            <img
                                src={getSkillIconPath(skill.name)}
                                alt={skill.name}
                                className="h-3 w-3"
                            />
                            <span>{skill.name} {skill.level}/99</span>
                            <span className="text-neutral-500 dark:text-neutral-400">
                                ({formatXP(skill.xpTo99)} remaining)
                            </span>
                        </div>
                    ))}
                </div>
            ),
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
                        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
                            {stat.label}
                        </div>
                        <div className="text-sm">{stat.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

