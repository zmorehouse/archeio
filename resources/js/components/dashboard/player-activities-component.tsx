interface Activity {
    rank: number;
    score: number;
}

interface PlayerActivitiesComponentProps {
    activities: Record<string, Activity>;
}

export function PlayerActivitiesComponent({
    activities,
}: PlayerActivitiesComponentProps) {
    const formatNumber = (num: number | null | undefined): string => {
        if (num === null || num === undefined || num === -1) return 'N/A';
        return num.toLocaleString();
    };

    const activityList = Object.entries(activities)
        .filter(([, activity]) => activity.score > 0 || activity.rank > 0)
        .map(([name, activity]) => ({
            name,
            ...activity,
        }))
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.name.localeCompare(b.name);
        })
        .slice(0, 10); // Limit to top 10 for component

    return (
        <div className="h-full">
            <h3 className="mb-3 text-lg font-semibold">Top Activities</h3>
            <div className="space-y-2 overflow-y-auto">
                {activityList.map((activity) => (
                    <div
                        key={activity.name}
                        className="rounded-lg border border-sidebar-border/70 p-2 dark:border-sidebar-border"
                    >
                        <div className="mb-1 flex items-center justify-between">
                            <span className="text-sm font-medium">
                                {activity.name}
                            </span>
                            <span className="text-sm font-bold">
                                {formatNumber(activity.score)}
                            </span>
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            <div className="flex justify-between">
                                <span>Rank:</span>
                                <span>{formatNumber(activity.rank)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

