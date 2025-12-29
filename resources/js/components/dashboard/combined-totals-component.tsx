import { formatNumber, formatXP, getSkillIconPath, SKILL_ORDER } from '@/lib/runescape-utils';

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

interface CombinedTotalsComponentProps {
    players: Player[];
}

export function CombinedTotalsComponent({ players }: CombinedTotalsComponentProps) {
    // Calculate combined totals
    const combinedLevels = players.reduce((sum, player) => {
        return sum + (player.skills?.Overall?.level || 0);
    }, 0);

    const combinedXP = players.reduce((sum, player) => {
        return sum + (player.skills?.Overall?.experience || 0);
    }, 0);

    // Calculate average levels per skill (excluding Overall)
    const skillAverages = SKILL_ORDER.filter(skillName => skillName !== 'Overall')
        .map(skillName => {
            const totalLevel = players.reduce((sum, player) => {
                return sum + (player.skills?.[skillName]?.level || 0);
            }, 0);
            const average = players.length > 0 ? totalLevel / players.length : 0;
            return { skill: skillName, average };
        })
        .sort((a, b) => b.average - a.average);

    const overallAverage = players.length > 0 ? combinedLevels / players.length : 0;

    return (
        <div className="h-full">
            <h3 className="mb-3 text-lg font-semibold">Combined Totals</h3>
            <div className="space-y-4">
                <div className="rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                        Total Levels & XP
                    </div>
                    <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                            <span>Total Levels:</span>
                            <span className="font-semibold">{formatNumber(combinedLevels)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Total XP:</span>
                            <span className="font-semibold">{formatXP(combinedXP)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Average Overall Level:</span>
                            <span className="font-semibold">{overallAverage.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
                        Average Skill Levels
                    </div>
                    <div className="grid grid-cols-3 gap-x-4 gap-y-1 max-h-64 overflow-y-auto overflow-x-auto">
                        {skillAverages.map(({ skill, average }) => (
                            <div key={skill} className="flex items-center gap-1.5 text-sm">
                                <img
                                    src={getSkillIconPath(skill)}
                                    alt={skill}
                                    className="h-4 w-4 flex-shrink-0"
                                    title={skill}
                                />
                                <span className="truncate min-w-0">{skill}:</span>
                                <span className="font-medium ml-auto">{Math.floor(average)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

