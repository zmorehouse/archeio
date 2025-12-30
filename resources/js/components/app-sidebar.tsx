import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
    useSidebar,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid } from 'lucide-react';
import { useMemo } from 'react';
import { detectActivityEvents } from '@/lib/activity-detector';
import { ActivityLedger } from '@/components/activity-ledger';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { state } = useSidebar();
    const page = usePage<SharedData>();
    const players = useMemo(() => page.props.players || [], [page.props.players]);
    const historicalStats = useMemo(() => (page.props.historicalStats as Record<number, Array<{
        fetched_at: string;
        overall_experience: number;
        overall_level: number;
        skills: Record<string, { rank: number; level: number; experience: number }>;
    }>>) || {}, [page.props.historicalStats]);

    const activityEvents = useMemo(() => {
        // Ensure historicalStats is an object and all values are arrays
        const safeHistoricalStats: Record<number, Array<{
            fetched_at: string;
            overall_experience: number;
            overall_level: number;
            skills: Record<string, { rank: number; level: number; experience: number }>;
        }>> = {};
        
        // Check if historicalStats exists and is an object
        if (historicalStats && typeof historicalStats === 'object' && !Array.isArray(historicalStats)) {
            Object.keys(historicalStats).forEach(key => {
                const playerId = Number(key);
                if (!isNaN(playerId)) {
                    const stats = historicalStats[playerId];
                    if (Array.isArray(stats) && stats.length > 0) {
                        safeHistoricalStats[playerId] = stats;
                    }
                }
            });
        }
        
        // Only call detectActivityEvents if we have valid data
        if (players.length > 0 && Object.keys(safeHistoricalStats).length > 0) {
            return detectActivityEvents(players, safeHistoricalStats).slice(0, 5);
        }
        
        return [];
    }, [players, historicalStats]);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Platform</SidebarGroupLabel>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={page.url === dashboard().url}
                            >
                                <Link href={dashboard()} prefetch>
                                    <LayoutGrid />
                                    <span>Dashboard</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                <SidebarSeparator />

                <SidebarGroup>
                    <SidebarGroupLabel>Players</SidebarGroupLabel>
                    <SidebarMenu>
                        {players.map((player) => {
                            const initials = player.name
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2);
                            
                            return (
                            <SidebarMenuItem key={player.id}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={page.url === `/players/${player.name}`}
                                        tooltip={{ children: player.name }}
                                >
                                    <Link href={`/players/${player.name}`} prefetch>
                                            <div className="flex size-6 items-center justify-center rounded bg-primary/10 text-xs font-semibold text-primary shrink-0">
                                                {initials}
                                            </div>
                                        <span>{player.name}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                {state === "expanded" && (
                    <SidebarGroup className="hidden md:block">
                        <SidebarGroupLabel>Recent Activity</SidebarGroupLabel>
                        <div className="px-2 pb-2">
                            <ActivityLedger events={activityEvents} compact={true} maxItems={3} />
                        </div>
                    </SidebarGroup>
                )}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
