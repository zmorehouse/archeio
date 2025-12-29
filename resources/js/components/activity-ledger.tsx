import { ActivityEvent } from '@/lib/activity-detector';
import { getSkillIconPath } from '@/lib/runescape-utils';
import { Trophy, TrendingUp, Award, Sword } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
}

interface ActivityLedgerProps {
    events: ActivityEvent[];
    maxItems?: number;
    compact?: boolean;
}

export function ActivityLedger({ events, maxItems = 5, compact = false }: ActivityLedgerProps) {
    const [visibleItems, setVisibleItems] = useState<number>(0);
    const previousMaxItemsRef = useRef<number>(0);
    const previousEventsRef = useRef<ActivityEvent[]>([]);
    const isInitialMountRef = useRef<boolean>(true);

    useEffect(() => {
        const eventsChanged = previousEventsRef.current.length !== events.length || 
            previousEventsRef.current.some((e, i) => e.id !== events[i]?.id);
        
        // Only animate on initial mount or when events array changes (not when maxItems increases)
        if (isInitialMountRef.current || (eventsChanged && previousMaxItemsRef.current === 0)) {
            // Reset and animate in items one at a time
            setVisibleItems(0);
            const timer = setTimeout(() => {
                events.slice(0, maxItems).forEach((_, index) => {
                    setTimeout(() => {
                        setVisibleItems(prev => Math.max(prev, index + 1));
                    }, index * 100);
                });
            }, 100);
            previousMaxItemsRef.current = maxItems;
            previousEventsRef.current = events;
            isInitialMountRef.current = false;
            return () => clearTimeout(timer);
        } else if (maxItems > previousMaxItemsRef.current) {
            // When loading more, just show all items immediately without animation
            setVisibleItems(maxItems);
            previousMaxItemsRef.current = maxItems;
        } else if (eventsChanged) {
            // If events changed but maxItems didn't increase, re-animate
            setVisibleItems(0);
            const timer = setTimeout(() => {
                events.slice(0, maxItems).forEach((_, index) => {
                    setTimeout(() => {
                        setVisibleItems(prev => Math.max(prev, index + 1));
                    }, index * 100);
                });
            }, 100);
            previousMaxItemsRef.current = maxItems;
            previousEventsRef.current = events;
            return () => clearTimeout(timer);
        } else {
            // If maxItems decreased or stayed same, just update visible items
            setVisibleItems(maxItems);
            previousMaxItemsRef.current = maxItems;
        }
    }, [events, maxItems]);

    if (events.length === 0) {
        return (
            <div className="text-xs text-neutral-500 dark:text-neutral-400 text-center py-2">
                No recent activity
            </div>
        );
    }

    const getEventIcon = (event: ActivityEvent) => {
        switch (event.type) {
            case 'level_gain':
                return event.skill ? (
                    <img
                        src={getSkillIconPath(event.skill)}
                        alt={event.skill}
                        className="size-4 shrink-0"
                    />
                ) : (
                    <TrendingUp className="size-4 shrink-0" />
                );
            case 'xp_milestone':
                return <Award className="size-4 shrink-0" />;
            case 'total_level_milestone':
                return <Trophy className="size-4 shrink-0" />;
            case 'boss_kill':
                return <Sword className="size-4 shrink-0" />;
            default:
                return <TrendingUp className="size-4 shrink-0" />;
        }
    };

    const getEventColor = (event: ActivityEvent) => {
        switch (event.type) {
            case 'level_gain':
                return 'text-blue-600 dark:text-blue-400';
            case 'xp_milestone':
                return 'text-green-600 dark:text-green-400';
            case 'total_level_milestone':
                return 'text-yellow-600 dark:text-yellow-400';
            case 'boss_kill':
                return 'text-red-600 dark:text-red-400';
            default:
                return 'text-neutral-600 dark:text-neutral-400';
        }
    };

    return (
        <div className={compact ? "space-y-2" : "space-y-3"}>
            {events.slice(0, maxItems).map((event, index) => {
                const isVisible = index < visibleItems;
                return (
                    <div
                        key={event.id}
                        className={`flex items-start gap-2 rounded-lg border border-sidebar-border/50 bg-sidebar-accent/30 p-2.5 transition-all duration-400 ease-out ${compact ? 'text-xs' : 'text-sm'} ${
                            isVisible 
                                ? 'opacity-100 translate-y-0' 
                                : 'opacity-0 translate-y-2'
                        }`}
                    >
                        <div className={`mt-0.5 shrink-0 ${getEventColor(event)}`}>
                            {getEventIcon(event)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium truncate">{event.playerName}</span>
                                <span className={`${getEventColor(event)} truncate`}>
                                    {event.description}
                                </span>
                            </div>
                            <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
                                {formatTimeAgo(event.timestamp)}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

