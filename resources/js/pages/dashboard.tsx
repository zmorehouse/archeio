import { ComponentRenderer } from '@/components/dashboard/component-renderer';
import { DashboardGrid } from '@/components/dashboard-grid';
import { DashboardSettings } from '@/components/dashboard-settings';
import { useDashboardLayout } from '@/hooks/use-dashboard-layout';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { RefreshCw, LayoutGrid, Columns2, Columns3 } from 'lucide-react';
import { useState, useEffect } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface Player {
    id: number;
    name: string;
    overall_level: number | null;
    overall_rank: number | null;
    overall_experience: number | null;
    last_updated?: string | null;
    skills?: Record<string, { rank: number; level: number; experience: number }>;
    activities?: Record<string, { rank: number; score: number }>;
}

interface DashboardProps {
    players: Player[];
    historicalStats?: Record<number, Array<{
        fetched_at: string;
        overall_experience: number;
        overall_level: number;
        skills: Record<string, { rank: number; level: number; experience: number }>;
    }>>;
}

export default function Dashboard({ players, historicalStats = {} }: DashboardProps) {
    const { layout, toggleComponent, reorderComponents, updateLayout, resetLayout } =
        useDashboardLayout('dashboard');
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
            const saved = localStorage.getItem('dashboard-column-count');
            const savedCount = saved ? parseInt(saved) as 1 | 2 | 3 : 2;
            return Math.min(savedCount, 2) as 1 | 2;
        }
        
        // Desktop: default to 3, or use saved value
        const saved = localStorage.getItem('dashboard-column-count');
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
                    const saved = localStorage.getItem('dashboard-column-count');
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

        // Simulate progress for loading bar
        const progressInterval = setInterval(() => {
            setRefreshProgress((prev) => {
                if (prev >= 90) return prev;
                return prev + 10;
            });
        }, 200);

        try {
            const response = await fetch('/api/v1/players/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
            });

            clearInterval(progressInterval);
            setRefreshProgress(100);

            if (response.ok) {
                // Reload the page after a short delay to show updated data
                setTimeout(() => {
                    router.reload({ only: ['players', 'historicalStats'] });
                    setIsRefreshing(false);
                    if (!isAutoRefresh) {
                        setShowNotification(false);
                    }
                }, 500);
            } else {
                console.error('Failed to refresh:', await response.text());
                setIsRefreshing(false);
                if (!isAutoRefresh) {
                    setShowNotification(false);
                    setRefreshProgress(0);
                }
            }
        } catch (error) {
            clearInterval(progressInterval);
            console.error('Failed to refresh:', error);
            setIsRefreshing(false);
            if (!isAutoRefresh) {
                setShowNotification(false);
                setRefreshProgress(0);
            }
        }
    };

    // Auto-refresh on first visit in session
    useEffect(() => {
        const hasRefreshed = sessionStorage.getItem('dashboard-auto-refreshed');
        if (!hasRefreshed) {
            sessionStorage.setItem('dashboard-auto-refreshed', 'true');
            handleForceRefresh(true); // true = auto refresh, no notification
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="rounded-xl border border-sidebar-border/70 bg-white p-6 dark:border-sidebar-border dark:bg-neutral-900">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">Dashboard</h1>
                            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                Last updated:{' '}
                                {(() => {
                                    const lastUpdated = players
                                        .map(p => p.last_updated)
                                        .filter(Boolean)
                                        .sort()
                                        .reverse()[0];
                                    return lastUpdated 
                                        ? new Date(lastUpdated).toLocaleString()
                                        : 'Never';
                                })()}
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
                                    localStorage.setItem('dashboard-column-count', '1');
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
                                    localStorage.setItem('dashboard-column-count', '2');
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
                                    localStorage.setItem('dashboard-column-count', '3');
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
                        />
                        </div>
                    </div>
                </div>
                <DashboardGrid
                    layout={{ ...layout, items: enabledItems }}
                    onLayoutChange={(newLayout) => updateLayout(() => newLayout)}
                    columnCount={columnCount}
                >
                    {(componentId) => (
                        <ComponentRenderer
                            componentId={componentId}
                            props={{ players, historicalStats }}
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
