import { ComponentRenderer } from '@/components/dashboard/component-renderer';
import { DashboardGrid } from '@/components/dashboard-grid';
import { DashboardSettings } from '@/components/dashboard-settings';
import { useDashboardLayout } from '@/hooks/use-dashboard-layout';
import { playerComponentRegistry } from '@/lib/player-component-registry';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { RefreshCw, LayoutGrid, Columns2, Columns3 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Skill {
    rank: number;
    level: number;
    experience: number;
}

interface Activity {
    rank: number;
    score: number;
}

interface PlayerStats {
    skills: Record<string, Skill>;
    activities: Record<string, Activity>;
    fetched_at: string;
}

interface Player {
    id: number;
    name: string;
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

interface PlayerProps {
    player: Player;
    stats: PlayerStats | null;
    playerHistoricalStats?: Array<{
        fetched_at: string;
        overall_experience: number;
        overall_level: number;
        skills: Record<string, { rank: number; level: number; experience: number }>;
    }>;
}

export default function PlayerPage({ player, stats, playerHistoricalStats = [] }: PlayerProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: player.name,
            href: `/players/${player.name}`,
        },
    ];

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

    if (!stats) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={player.name} />
                <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                    <div className="rounded-xl border border-sidebar-border/70 bg-white p-6 dark:border-sidebar-border dark:bg-neutral-900">
                        <h1 className="mb-4 text-3xl font-bold">{player.name}</h1>
                        <p className="text-neutral-500 dark:text-neutral-400">
                            No statistics available yet. Stats will appear here once they are fetched.
                        </p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const skills = SKILL_ORDER.map((skillName) => ({
        name: skillName,
        ...stats.skills[skillName],
    }));

    const activities = Object.entries(stats.activities)
        .filter(([_, activity]) => activity.score > 0 || activity.rank > 0)
        .map(([name, activity]) => ({
            name,
            ...activity,
        }))
        .sort((a, b) => {
            // Sort by score descending, then by name
            if (b.score !== a.score) return b.score - a.score;
            return a.name.localeCompare(b.name);
        });

    const { layout, toggleComponent, reorderComponents, updateLayout, resetLayout } =
        useDashboardLayout('player', playerComponentRegistry);
    
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [refreshProgress, setRefreshProgress] = useState(0);
    const [columnCount, setColumnCount] = useState<1 | 2 | 3>(() => {
        if (typeof window === 'undefined') return 3;
        
        const width = window.innerWidth;
        // iPhone sizes (max 1 column)
        if (width < 768) {
            return 1;
        }
        // iPad sizes (max 2 columns)
        if (width < 1024) {
            const saved = localStorage.getItem('player-page-column-count');
            const savedCount = saved ? parseInt(saved) as 1 | 2 | 3 : 2;
            return Math.min(savedCount, 2) as 1 | 2;
        }
        
        // Desktop: default to 3, or use saved value
        const saved = localStorage.getItem('player-page-column-count');
        return saved ? (parseInt(saved) as 1 | 2 | 3) : 3;
    });

    // Update column count on resize with limits
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 768) {
                // iPhone: force 1 column
                if (columnCount !== 1) {
                    setColumnCount(1);
                }
            } else if (width < 1024) {
                // iPad: max 2 columns
                if (columnCount === 3) {
                    setColumnCount(2);
                }
            } else {
                // Desktop: allow 3 columns, default to 3 if not set
                if (columnCount === 1 && width >= 1024) {
                    const saved = localStorage.getItem('player-page-column-count');
                    if (!saved) {
                        setColumnCount(3);
                    }
                }
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [columnCount]);

    // Filter items to only show enabled components
    const enabledItems = layout.items.filter((item) =>
        layout.enabled.includes(item.i),
    );

    const handleForceRefresh = async (isAutoRefresh = false) => {
        setIsRefreshing(true);
        
        // Show notification for manual refresh
        if (!isAutoRefresh) {
            setShowNotification(true);
            setRefreshProgress(0);
        }

        try {
            const response = await fetch('/api/players/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to refresh');
            }

            const data = await response.json();
            
            // Simulate progress
            const progressInterval = setInterval(() => {
                setRefreshProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            // Wait for the refresh to complete
            await new Promise((resolve) => setTimeout(resolve, 2000));

            clearInterval(progressInterval);
            setRefreshProgress(100);

            // Reload the page after a short delay
            setTimeout(() => {
                router.reload({ only: ['player', 'stats', 'playerHistoricalStats'] });
                setIsRefreshing(false);
                if (!isAutoRefresh) {
                    setTimeout(() => {
                        setShowNotification(false);
                        setRefreshProgress(0);
                    }, 1000);
                }
            }, 500);
        } catch (error) {
            console.error('Error refreshing player stats:', error);
            setIsRefreshing(false);
            setRefreshProgress(0);
            if (!isAutoRefresh) {
                setTimeout(() => {
                    setShowNotification(false);
                    setRefreshProgress(0);
                }, 2000);
            }
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={player.name} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="rounded-xl border border-sidebar-border/70 bg-white p-6 dark:border-sidebar-border dark:bg-neutral-900">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">{player.name}</h1>
                            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                Last updated:{' '}
                                {new Date(stats.fetched_at).toLocaleString()}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
                            <Button
                                variant="outline"
                                onClick={() => handleForceRefresh(false)}
                                disabled={isRefreshing}
                            >
                                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                <span className="ml-2">Force Refresh</span>
                            </Button>
                            <div className="hidden md:flex items-center border rounded-md border-sidebar-border/70 dark:border-sidebar-border">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`h-9 w-9 rounded-none rounded-l-md ${columnCount === 1 ? 'bg-primary text-primary-foreground' : ''}`}
                                    onClick={() => {
                                        setColumnCount(1);
                                        localStorage.setItem('player-page-column-count', '1');
                                    }}
                                    title="1 Column"
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`h-9 w-9 rounded-none ${columnCount === 2 ? 'bg-primary text-primary-foreground' : ''}`}
                                    onClick={() => {
                                        setColumnCount(2);
                                        localStorage.setItem('player-page-column-count', '2');
                                    }}
                                    title="2 Columns"
                                >
                                    <Columns2 className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`h-9 w-9 rounded-none rounded-r-md ${columnCount === 3 ? 'bg-primary text-primary-foreground' : ''}`}
                                    onClick={() => {
                                        setColumnCount(3);
                                        localStorage.setItem('player-page-column-count', '3');
                                    }}
                                    title="3 Columns"
                                >
                                    <Columns3 className="h-4 w-4" />
                                </Button>
                            </div>
                            <DashboardSettings
                                layout={layout}
                                onToggle={toggleComponent}
                                onReorder={reorderComponents}
                                onReset={resetLayout}
                                registry={playerComponentRegistry}
                            />
                        </div>
                    </div>
                </div>

                {/* Component Grid */}
                <DashboardGrid
                    layout={{ ...layout, items: enabledItems }}
                    onLayoutChange={(newLayout) => updateLayout(() => newLayout)}
                    columnCount={columnCount}
                >
                    {(componentId) => (
                        <ComponentRenderer
                            componentId={componentId}
                            props={{
                                playerId: player.id,
                                playerName: player.name,
                                skills: stats.skills,
                                activities: stats.activities,
                                historicalStats: playerHistoricalStats,
                            }}
                        />
                    )}
                </DashboardGrid>
            </div>

            {/* Notification for manual refresh */}
            {showNotification && (
                <div className="fixed bottom-4 right-4 z-50 w-80 rounded-lg border border-sidebar-border/70 bg-white p-4 shadow-lg dark:border-sidebar-border dark:bg-neutral-900">
                    <div className="mb-2 flex items-center gap-2">
                        <RefreshCw className={`h-4 w-4 animate-spin ${isRefreshing ? '' : 'hidden'}`} />
                        <span className="text-sm font-medium">Getting latest stats...</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                        <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${refreshProgress}%` }}
                        />
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

