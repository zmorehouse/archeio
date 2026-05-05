import { ComponentRegistry } from './component-registry';

// Player-specific component registry - only components relevant to a single player
export const playerComponentRegistry: ComponentRegistry = {
    'player-levels': {
        id: 'player-levels',
        title: 'Levels',
        description: 'All skill levels for this player',
        defaultEnabled: true,
        defaultSize: { w: 6, h: 8 },
        minSize: { w: 4, h: 6 },
    },
    'player-xp-over-time': {
        id: 'player-xp-over-time',
        title: 'XP Over Time',
        description: 'XP gain over time with line and bar chart views',
        defaultEnabled: true,
        defaultSize: { w: 8, h: 6 },
        minSize: { w: 6, h: 4 },
    },
    'player-skill-training': {
        id: 'player-skill-training',
        title: 'Skill Training Distribution',
        description: 'Percentage breakdown of skills being trained',
        defaultEnabled: true,
        defaultSize: { w: 5, h: 4 },
        minSize: { w: 4, h: 3 },
    },
    'player-general-stats': {
        id: 'player-general-stats',
        title: 'General Stats',
        description: 'Next level, furthest grind, and number of 99s',
        defaultEnabled: true,
        defaultSize: { w: 4, h: 5 },
        minSize: { w: 3, h: 3 },
    },
    'player-activity-ledger': {
        id: 'player-activity-ledger',
        title: 'Activity Ledger',
        description: 'Latest 10 significant activities',
        defaultEnabled: true,
        defaultSize: { w: 6, h: 6 },
        minSize: { w: 4, h: 4 },
    },
};

