import { Link } from '@inertiajs/react';
import { formatXP, getSkillIconPath, SKILL_ORDER, xpForNextLevel } from '@/lib/runescape-utils';

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

interface NextLevelComponentProps {
    players: Player[];
}

interface NextLevelInfo {
    player: Player;
    skill: string;
    currentLevel: number;
    nextLevel: number;
    xpRemaining: number;
}

export function NextLevelComponent({ players }: NextLevelComponentProps) {
    const nextLevels: NextLevelInfo[] = [];

    // Only get the closest next level for each player
    players.forEach((player) => {
        let closest: NextLevelInfo | null = null;
        let minXpRemaining = Infinity;

        SKILL_ORDER.forEach((skillName) => {
            if (skillName === 'Overall') return;
            const skill = player.skills?.[skillName];
            if (!skill || skill.level >= 99) return;

            const xpRemaining = xpForNextLevel(skill.experience);
            if (xpRemaining < minXpRemaining) {
                minXpRemaining = xpRemaining;
                closest = {
                    player,
                    skill: skillName,
                    currentLevel: skill.level,
                    nextLevel: skill.level + 1,
                    xpRemaining,
                };
            }
        });

        if (closest) {
            nextLevels.push(closest);
        }
    });

    // Sort by XP remaining (lowest first)
    nextLevels.sort((a, b) => a.xpRemaining - b.xpRemaining);

    return (
        <div className="h-full flex flex-col">
            <h3 className="mb-3 text-lg font-semibold">Next Level</h3>
            <div className="flex-1 overflow-auto overflow-x-auto">
                <table className="w-full text-sm min-w-[400px]">
                    <thead>
                        <tr className="border-b border-sidebar-border/70 dark:border-sidebar-border">
                            <th className="px-4 py-3 text-left text-sm font-semibold">Player</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Next Level</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">EXP Remaining</th>
                        </tr>
                    </thead>
                    <tbody>
                        {nextLevels.slice(0, 50).map((info, index) => (
                            <tr
                                key={`${info.player.id}-${info.skill}-${index}`}
                                className="border-b border-sidebar-border/30 hover:bg-neutral-50 dark:border-sidebar-border dark:hover:bg-neutral-800"
                            >
                                <td className="px-4 py-2">
                                    <Link
                                        href={`/players/${info.player.name}`}
                                        className="font-medium text-primary hover:underline"
                                    >
                                        {info.player.name}
                                    </Link>
                                </td>
                                <td className="px-4 py-2">
                                    <div className="flex items-center gap-2">
                                        <img
                                            src={getSkillIconPath(info.skill)}
                                            alt={info.skill}
                                            className="h-4 w-4"
                                        />
                                        <span>
                                            {info.skill} {info.currentLevel} → {info.nextLevel}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-2 font-medium">
                                    {formatXP(info.xpRemaining)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

