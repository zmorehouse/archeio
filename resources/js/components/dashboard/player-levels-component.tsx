import { formatXP, getSkillIconPath, SKILL_ORDER, xpForNextLevel } from '@/lib/runescape-utils';
import { useEffect, useRef, useState } from 'react';

interface Skill {
    rank: number;
    level: number;
    experience: number;
}

interface PlayerLevelsComponentProps {
    skills: Record<string, Skill>;
}

export function PlayerLevelsComponent({ skills }: PlayerLevelsComponentProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [columns, setColumns] = useState(2);
    const skillList = SKILL_ORDER.map((skillName) => ({
        name: skillName,
        ...skills[skillName],
    })).filter(skill => skill.name !== 'Overall');

    // Calculate total XP
    const totalXp = skills.Overall?.experience || 0;

    // Calculate average skill level (excluding Overall)
    const skillLevels = Object.entries(skills)
        .filter(([name]) => name !== 'Overall')
        .map(([, skill]) => skill.level);
    const avgSkillLevel = skillLevels.length > 0 
        ? skillLevels.reduce((sum, level) => sum + level, 0) / skillLevels.length 
        : 0;

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

    // Calculate columns based on container width
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const updateColumns = () => {
            const width = container.offsetWidth;
            // Adjust breakpoints based on typical skill card width (~150-200px with gap)
            // 2 columns: < 400px
            // 3 columns: 400px - 650px
            // 4 columns: > 650px
            if (width < 400) {
                setColumns(2);
            } else if (width < 650) {
                setColumns(3);
            } else {
                setColumns(4);
            }
        };

        // Initial calculation
        updateColumns();

        // Use ResizeObserver to watch for size changes
        const resizeObserver = new ResizeObserver(updateColumns);
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    return (
        <div className="h-full flex flex-col">
            <h3 className="mb-3 text-lg font-semibold">Levels</h3>
            
            {/* Summary Stats */}
            <div className="mb-3 grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-sidebar-border/70 bg-white p-2 dark:border-sidebar-border dark:bg-neutral-900">
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Total XP</div>
                    <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatXP(totalXp)}
                    </div>
                </div>
                {combatLevel !== null && (
                    <div className="rounded-lg border border-sidebar-border/70 bg-white p-2 dark:border-sidebar-border dark:bg-neutral-900">
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Combat Level</div>
                        <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                            {combatLevel}
                        </div>
                    </div>
                )}
                <div className="rounded-lg border border-sidebar-border/70 bg-white p-2 dark:border-sidebar-border dark:bg-neutral-900">
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Avg Skill Level</div>
                    <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {avgSkillLevel.toFixed(1)}
                    </div>
                </div>
            </div>

            <div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-auto">
                <div className="grid gap-3 min-w-0" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
                    {skillList.map((skill) => (
                        <div
                            key={skill.name}
                            className="rounded-lg border border-sidebar-border/70 bg-white p-3 dark:border-sidebar-border dark:bg-neutral-900"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <img
                                    src={getSkillIconPath(skill.name)}
                                    alt={skill.name}
                                    className="h-5 w-5"
                                />
                                <span className="font-semibold text-sm">{skill.name}</span>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-neutral-500 dark:text-neutral-400">Level</span>
                                    <span className="text-lg font-bold">{skill.level}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-neutral-500 dark:text-neutral-400">XP</span>
                                    <div className="text-right">
                                        <div className="text-sm font-medium">{formatXP(skill.experience)}</div>
                                        {skill.level < 99 && (
                                            <div className="text-[10px] text-neutral-400 dark:text-neutral-500">
                                                +{formatXP(xpForNextLevel(skill.experience))} to next
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {skill.rank > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-neutral-500 dark:text-neutral-400">Rank</span>
                                        <span className="text-sm font-medium">{skill.rank.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

