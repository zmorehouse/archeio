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
    'Attack': '#db2016',           
    'Defence': '#629396',          
    'Strength': '#e35f1e',         
    'Hitpoints': '#ff0051',        
    'Ranged': '#1b590c',           
    'Prayer': '#fbbf24',           
    'Magic': '#161eab',           
    'Cooking': '#f5ce0b',          
    'Woodcutting': '#16a34a',     
    'Fletching': '#62d17a',        
    'Fishing': '#06b6d4',         
    'Firemaking': '#f97316',      
    'Crafting': '#7d502a',         
    'Smithing': '#3b4452',         
    'Mining': '#78716c',           
    'Herblore': '#4eb332',        
    'Agility': '#1c1c1c',         
    'Thieving': '#a855f7',         
    'Slayer': '#cfc4b6',          
    'Farming': '#385908',         
    'Runecrafting': '#878787',     
    'Hunter': '#755510',           
    'Construction': '#694528',     
    'Sailing': '#65bae6',          
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
