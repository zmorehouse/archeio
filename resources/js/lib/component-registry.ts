export interface ComponentConfig {
    id: string;
    title: string;
    description?: string;
    defaultEnabled: boolean;
    defaultSize: { w: number; h: number };
    minSize?: { w: number; h: number };
    maxSize?: { w: number; h: number };
}

export interface ComponentRegistry {
    [key: string]: ComponentConfig;
}

// Component registry - add new components here
export const componentRegistry: ComponentRegistry = {
    'overall-rankings': {
        id: 'overall-rankings',
        title: 'Overall Rankings',
        description: 'Ranked table of all players by overall stats',
        defaultEnabled: true,
        defaultSize: { w: 6, h: 5 },
        minSize: { w: 4, h: 3 },
    },
    'ninety-nines': {
        id: 'ninety-nines',
        title: '99s Table',
        description: 'Players with level 99 skills and next closest 99s',
        defaultEnabled: true,
        defaultSize: { w: 6, h: 4 },
        minSize: { w: 4, h: 3 },
    },
    'next-level': {
        id: 'next-level',
        title: 'Next Level',
        description: 'Players closest to their next level up',
        defaultEnabled: true,
        defaultSize: { w: 5, h: 4 },
        minSize: { w: 4, h: 3 },
    },
    'general-stats': {
        id: 'general-stats',
        title: 'General Stats',
        description: 'Interesting statistics and leaderboards',
        defaultEnabled: true,
        defaultSize: { w: 4, h: 5 },
        minSize: { w: 3, h: 3 },
    },
    'combined-totals': {
        id: 'combined-totals',
        title: 'Combined Totals',
        description: 'Total levels, XP, and average skills',
        defaultEnabled: true,
        defaultSize: { w: 4, h: 3 },
        minSize: { w: 3, h: 2 },
    },
    'xp-gained': {
        id: 'xp-gained',
        title: 'XP Gained',
        description: 'Daily and weekly XP gained comparison',
        defaultEnabled: true,
        defaultSize: { w: 5, h: 4 },
        minSize: { w: 4, h: 3 },
    },
    'levels-gained': {
        id: 'levels-gained',
        title: 'Levels Gained',
        description: 'Daily and weekly levels gained comparison',
        defaultEnabled: true,
        defaultSize: { w: 5, h: 4 },
        minSize: { w: 4, h: 3 },
    },
    'skill-training-pie': {
        id: 'skill-training-pie',
        title: 'Skill Training Distribution',
        description: 'Percentage breakdown of skills being trained',
        defaultEnabled: true,
        defaultSize: { w: 5, h: 4 },
        minSize: { w: 4, h: 3 },
    },
    'xp-over-time': {
        id: 'xp-over-time',
        title: 'XP Over Time',
        description: 'XP gain over time with line and bar chart views',
        defaultEnabled: true,
        defaultSize: { w: 8, h: 6 },
        minSize: { w: 6, h: 4 },
    },
    'all-activity-ledger': {
        id: 'all-activity-ledger',
        title: 'All Players Activity',
        description: 'Latest 25 activities across all players',
        defaultEnabled: true,
        defaultSize: { w: 6, h: 8 },
        minSize: { w: 4, h: 6 },
    },
};

export interface LayoutItem {
    i: string; // component id
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface LayoutConfig {
    items: LayoutItem[];
    enabled: string[]; // component ids that are enabled
}

