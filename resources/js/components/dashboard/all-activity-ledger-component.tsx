import { ActivityLedger } from '@/components/activity-ledger';
import { detectActivityEvents } from '@/lib/activity-detector';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

interface Player {
    id: number;
    name: string;
}

interface HistoricalStat {
    fetched_at: string;
    overall_experience: number;
    overall_level: number;
    skills: Record<string, { rank: number; level: number; experience: number }>;
    activities?: Record<string, { rank: number; score: number }>;
}

interface AllActivityLedgerComponentProps {
    players: Player[];
    historicalStats?: Record<number, HistoricalStat[]>;
}

export function AllActivityLedgerComponent({ players, historicalStats = {} }: AllActivityLedgerComponentProps) {
    const [displayCount, setDisplayCount] = useState(5);
    
    const allActivityEvents = useMemo(() => {
        // Ensure historicalStats is an object and all values are arrays
        const safeHistoricalStats: Record<number, Array<{
            fetched_at: string;
            overall_experience: number;
            overall_level: number;
            skills: Record<string, { rank: number; level: number; experience: number }>;
            activities?: Record<string, { rank: number; score: number }>;
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
        
        // Get all events for all players
        if (players.length > 0 && Object.keys(safeHistoricalStats).length > 0) {
            return detectActivityEvents(players, safeHistoricalStats)
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        }
        
        return [];
    }, [players, historicalStats]);

    const displayedEvents = allActivityEvents.slice(0, displayCount);
    const hasMore = allActivityEvents.length > displayCount;

    const handleLoadMore = () => {
        setDisplayCount(prev => Math.min(prev + 5, allActivityEvents.length));
    };

    return (
        <div className="h-full flex flex-col">
            <h3 className="mb-3 text-lg font-semibold">All Players Activity</h3>
            <div className="flex-1 overflow-y-auto overflow-x-auto">
                <ActivityLedger 
                    events={displayedEvents} 
                    compact={false} 
                    maxItems={displayedEvents.length} 
                />
                {hasMore && (
                    <div className="mt-4 flex justify-center">
                        <Button
                            variant="outline"
                            onClick={handleLoadMore}
                            className="text-sm"
                        >
                            Load More
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

