interface StatsSummaryComponentProps {
    players?: any[];
}

export function StatsSummaryComponent({ players = [] }: StatsSummaryComponentProps) {
    const totalPlayers = players.length;
    const totalLevel = players.reduce((sum, p) => sum + (p.overall_level || 0), 0);
    const avgLevel = totalPlayers > 0 ? Math.round(totalLevel / totalPlayers) : 0;

    return (
        <div className="h-full">
            <h3 className="mb-3 text-lg font-semibold">Stats Summary</h3>
            <div className="space-y-3">
                <div className="rounded-lg bg-neutral-100 p-3 dark:bg-neutral-800">
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                        Total Players
                    </div>
                    <div className="text-2xl font-bold">{totalPlayers}</div>
                </div>
                <div className="rounded-lg bg-neutral-100 p-3 dark:bg-neutral-800">
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                        Average Level
                    </div>
                    <div className="text-2xl font-bold">{avgLevel}</div>
                </div>
            </div>
        </div>
    );
}

