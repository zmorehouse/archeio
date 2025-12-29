import { detectActivityEvents, ActivityEvent } from '@/lib/activity-detector';
import { ActivityLedger } from '@/components/activity-ledger';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

interface Skill {
    rank: number;
    level: number;
    experience: number;
}

interface HistoricalStat {
    fetched_at: string;
    overall_experience: number;
    overall_level: number;
    skills: Record<string, Skill>;
}

interface PlayerActivityLedgerComponentProps {
    playerId: number;
    playerName: string;
    historicalStats?: HistoricalStat[];
}

export function PlayerActivityLedgerComponent({ 
    playerId, 
    playerName, 
    historicalStats = [] 
}: PlayerActivityLedgerComponentProps) {
    const [displayCount, setDisplayCount] = useState(5);
    
    const allActivityEvents = useMemo(() => {
        // Convert to the format expected by detectActivityEvents
        const players = [{ id: playerId, name: playerName }];
        const statsRecord: Record<number, HistoricalStat[]> = {
            [playerId]: historicalStats,
        };
        
        // Get all events for this player
        const allEvents = detectActivityEvents(players, statsRecord)
            .filter(event => event.playerId === playerId);
        
        // Sort by timestamp (most recent first)
        return allEvents
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }, [playerId, playerName, historicalStats]);

    const displayedEvents = allActivityEvents.slice(0, displayCount);
    const hasMore = allActivityEvents.length > displayCount;

    const handleLoadMore = () => {
        setDisplayCount(prev => Math.min(prev + 5, allActivityEvents.length));
    };

    return (
        <div className="h-full flex flex-col">
            <h3 className="mb-3 text-lg font-semibold">Activity Ledger</h3>
            <div className="flex-1 overflow-y-auto">
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

