export const SKILL_ORDER = [
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

export const COMBAT_SKILLS = ['Attack', 'Defence', 'Strength', 'Hitpoints', 'Ranged', 'Prayer', 'Magic'];
export const NON_COMBAT_SKILLS = SKILL_ORDER.filter(skill => skill !== 'Overall' && !COMBAT_SKILLS.includes(skill));

// Standardized color palette for skills (excluding Overall)
export const SKILL_COLORS: Record<string, string> = {
    'Attack': '#ef4444',           // Red
    'Defence': '#3b82f6',          // Blue
    'Strength': '#f97316',         // Orange
    'Hitpoints': '#10b981',        // Green
    'Ranged': '#84cc16',           // Lime
    'Prayer': '#fbbf24',           // Yellow
    'Magic': '#8b5cf6',            // Purple
    'Cooking': '#f59e0b',          // Amber
    'Woodcutting': '#16a34a',      // Emerald
    'Fletching': '#22c55e',        // Green
    'Fishing': '#06b6d4',          // Cyan
    'Firemaking': '#f97316',       // Orange
    'Crafting': '#ec4899',         // Pink
    'Smithing': '#64748b',         // Slate
    'Mining': '#78716c',           // Stone
    'Herblore': '#14b8a6',         // Teal
    'Agility': '#0ea5e9',          // Sky
    'Thieving': '#a855f7',         // Purple
    'Slayer': '#dc2626',           // Red
    'Farming': '#65a30d',          // Lime
    'Runecrafting': '#6366f1',     // Indigo
    'Hunter': '#ca8a04',           // Yellow
    'Construction': '#c2410c',     // Orange
    'Sailing': '#0284c7',          // Sky Blue
};

export function getSkillColor(skillName: string): string {
    return SKILL_COLORS[skillName] || '#94a3b8'; // Default to slate gray if skill not found
}

export function xpForLevel(level: number): number {
    if (level <= 1) return 0;
    let totalXp = 0;
    for (let i = 1; i < level; i++) {
        totalXp += Math.floor(i + 300 * Math.pow(2, i / 7));
    }
    return Math.floor(totalXp / 4);
}

export function levelFromXP(xp: number): number {
    if (xp < 0) return 1;
    for (let level = 1; level <= 99; level++) {
        if (xpForLevel(level + 1) > xp) {
            return level;
        }
    }
    return 99;
}

export function xpForNextLevel(currentXP: number): number {
    const currentLevel = levelFromXP(currentXP);
    if (currentLevel >= 99) return 0;
    const nextLevelXP = xpForLevel(currentLevel + 1);
    return nextLevelXP - currentXP;
}

export function xpToReachLevel(currentXP: number, targetLevel: number): number {
    const targetXP = xpForLevel(targetLevel);
    return Math.max(0, targetXP - currentXP);
}

export function getSkillIconPath(skillName: string): string {
    const normalizedName = skillName.toLowerCase().replace(/\s+/g, '-');
    return `/images/skills/${normalizedName}.png`;
}

export function formatXP(xp: number): string {
    if (xp >= 1000000) {
        return `${(xp / 1000000).toFixed(2)}M`;
    } else if (xp >= 1000) {
        return `${(xp / 1000).toFixed(1)}K`;
    }
    return xp.toLocaleString();
}

export function formatNumber(num: number): string {
    return num.toLocaleString();
}
