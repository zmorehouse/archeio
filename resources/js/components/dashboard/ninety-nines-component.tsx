import { Link } from '@inertiajs/react';
import { formatXP, getSkillIconPath, SKILL_ORDER, xpToReachLevel } from '@/lib/runescape-utils';
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

interface NinetyNinesComponentProps {
    players: Player[];
}

export function NinetyNinesComponent({ players }: NinetyNinesComponentProps) {
    const [hoveredPlayerId, setHoveredPlayerId] = useState<number | null>(null);
    
    interface Player99Info {
        player: Player;
        skills99: string[];
        nextClosest: { skill: string; currentLevel: number; xpRemaining: number } | null;
    }

    const playersWith99s: Player99Info[] = players
        .map((player) => {
            const skills99 = SKILL_ORDER.filter((skillName) => {
                if (skillName === 'Overall') return false;
                const skill = player.skills?.[skillName];
                return skill && skill.level >= 99;
            });

            // Find next closest 99 (skill with lowest XP needed to reach 99)
            let nextClosest: { skill: string; currentLevel: number; xpRemaining: number } | null = null;
            let minXpRemaining = Infinity;

            SKILL_ORDER.forEach((skillName) => {
                if (skillName === 'Overall') return;
                const skill = player.skills?.[skillName];
                if (!skill || skill.level >= 99) return;

                // Calculate XP needed from current level to reach level 99
                const xpRemaining = xpToReachLevel(skill.experience, 99);
                if (xpRemaining < minXpRemaining) {
                    minXpRemaining = xpRemaining;
                    nextClosest = {
                        skill: skillName,
                        currentLevel: skill.level,
                        xpRemaining,
                    };
                }
            });

            return {
                player,
                skills99,
                nextClosest,
            };
        })
        .filter((p) => p.skills99.length > 0 || p.nextClosest !== null)
        .sort((a, b) => b.skills99.length - a.skills99.length) as Player99Info[];

    return (
        <div className="h-full flex flex-col">
            <h3 className="mb-3 text-lg font-semibold">99s Table</h3>
            <div className="flex-1 overflow-auto overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                    <thead>
                        <tr className="border-b border-sidebar-border/70 dark:border-sidebar-border">
                            <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Level 99's</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Next Closest 99</th>
                        </tr>
                    </thead>
                    <tbody>
                        {playersWith99s.map(({ player, skills99, nextClosest }) => (
                            <tr
                                key={player.id}
                                className="border-b border-sidebar-border/30 hover:bg-neutral-50 dark:border-sidebar-border dark:hover:bg-neutral-800"
                            >
                                <td className="px-4 py-3">
                                    <Link
                                        href={`/players/${player.name}`}
                                        className="font-medium text-primary hover:underline"
                                    >
                                        {player.name}
                                    </Link>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">{skills99.length}</span>
                                        {skills99.length > 0 && (
                                            <div 
                                                className="flex items-center gap-1 min-h-[20px] relative"
                                                onMouseEnter={() => setHoveredPlayerId(player.id)}
                                                onMouseLeave={() => setHoveredPlayerId(null)}
                                            >
                                                {skills99.slice(0, 8).map((skillName) => (
                                                    <img
                                                        key={skillName}
                                                        src={getSkillIconPath(skillName)}
                                                        alt={skillName}
                                                        className="h-5 w-5 flex-shrink-0"
                                                        title={skillName}
                                                        onLoad={() => {
                                                            window.dispatchEvent(new Event('resize'));
                                                        }}
                                                    />
                                                ))}
                                                {skills99.length > 8 && (
                                                    <>
                                                        <span className="text-xs text-neutral-500 dark:text-neutral-400 px-1">
                                                            +{skills99.length - 8}
                                                        </span>
                                                        {hoveredPlayerId === player.id && (
                                                            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-neutral-900 border border-sidebar-border/70 dark:border-sidebar-border rounded-lg p-2 shadow-lg z-20 flex flex-wrap gap-1 max-w-[300px]">
                                                                {skills99.map((skillName) => (
                                                                    <img
                                                                        key={skillName}
                                                                        src={getSkillIconPath(skillName)}
                                                                        alt={skillName}
                                                                        className="h-5 w-5"
                                                                        title={skillName}
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {nextClosest ? (
                                        <div className="flex items-center gap-2 min-w-0">
                                            <img
                                                src={getSkillIconPath(nextClosest.skill)}
                                                alt={nextClosest.skill}
                                                className="h-4 w-4 flex-shrink-0"
                                            />
                                            <span className="truncate">
                                                <span className="hidden sm:inline">{nextClosest.skill} </span>
                                                <span className="sm:hidden">{nextClosest.skill.substring(0, 4)} </span>
                                                ({nextClosest.currentLevel}→99) —{' '}
                                                <span className="font-medium">
                                                    {formatXP(nextClosest.xpRemaining)}
                                                </span>
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-neutral-500 dark:text-neutral-400">Maxed</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

