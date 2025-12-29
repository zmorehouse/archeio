interface Skill {
    rank: number;
    level: number;
    experience: number;
}

interface PlayerSkillsComponentProps {
    skills: Record<string, Skill>;
}

const SKILL_ORDER = [
    'Overall',
    'Attack',
    'Defence',
    'Strength',
    'Hitpoints',
    'Ranged',
    'Prayer',
    'Magic',
    'Cooking',
    'Woodcutting',
    'Fletching',
    'Fishing',
    'Firemaking',
    'Crafting',
    'Smithing',
    'Mining',
    'Herblore',
    'Agility',
    'Thieving',
    'Slayer',
    'Farming',
    'Runecrafting',
    'Hunter',
    'Construction',
    'Sailing',
];

export function PlayerSkillsComponent({ skills }: PlayerSkillsComponentProps) {
    const formatNumber = (num: number | null | undefined): string => {
        if (num === null || num === undefined || num === -1) return 'N/A';
        return num.toLocaleString();
    };

    const formatExperience = (exp: number | null | undefined): string => {
        if (exp === null || exp === undefined || exp === 0) return 'N/A';
        if (exp >= 1_000_000_000) return `${(exp / 1_000_000_000).toFixed(2)}B`;
        if (exp >= 1_000_000) return `${(exp / 1_000_000).toFixed(2)}M`;
        if (exp >= 1_000) return `${(exp / 1_000).toFixed(2)}K`;
        return exp.toLocaleString();
    };

    const skillList = SKILL_ORDER.map((skillName) => ({
        name: skillName,
        ...skills[skillName],
    }));

    return (
        <div className="h-full">
            <h3 className="mb-3 text-lg font-semibold">Skills</h3>
            <div className="grid grid-cols-2 gap-2 overflow-y-auto">
                {skillList.map((skill) => (
                    <div
                        key={skill.name}
                        className="rounded-lg border border-sidebar-border/70 p-2 dark:border-sidebar-border"
                    >
                        <div className="mb-1 flex items-center justify-between">
                            <span className="text-sm font-medium">
                                {skill.name}
                            </span>
                            <span className="text-sm font-bold">
                                {skill.level > 0 ? skill.level : 'N/A'}
                            </span>
                        </div>
                        <div className="space-y-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                            <div className="flex justify-between">
                                <span>Rank:</span>
                                <span>{formatNumber(skill.rank)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>XP:</span>
                                <span>{formatExperience(skill.experience)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

