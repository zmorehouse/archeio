export function RecentActivityComponent() {
    return (
        <div className="h-full">
            <h3 className="mb-3 text-lg font-semibold">Recent Activity</h3>
            <div className="space-y-2 text-sm">
                <div className="rounded-lg bg-neutral-100 p-2 dark:bg-neutral-800">
                    <div className="font-medium">Zoobz69 gained a level!</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        2 hours ago
                    </div>
                </div>
                <div className="rounded-lg bg-neutral-100 p-2 dark:bg-neutral-800">
                    <div className="font-medium">Melburne6 completed a quest</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        5 hours ago
                    </div>
                </div>
            </div>
        </div>
    );
}

export function SkillComparisonComponent() {
    return (
        <div className="h-full">
            <h3 className="mb-3 text-lg font-semibold">Skill Comparison</h3>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span>Attack</span>
                    <span className="font-medium">90 avg</span>
                </div>
                <div className="flex justify-between">
                    <span>Strength</span>
                    <span className="font-medium">88 avg</span>
                </div>
                <div className="flex justify-between">
                    <span>Defence</span>
                    <span className="font-medium">85 avg</span>
                </div>
            </div>
        </div>
    );
}

export function LevelProgressComponent() {
    return (
        <div className="h-full">
            <h3 className="mb-3 text-lg font-semibold">Level Progress</h3>
            <div className="space-y-2">
                <div>
                    <div className="mb-1 flex justify-between text-sm">
                        <span>Overall</span>
                        <span>+5 this week</span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700">
                        <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: '65%' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function DummyChartComponent() {
    return (
        <div className="h-full">
            <h3 className="mb-3 text-lg font-semibold">Dummy Chart</h3>
            <div className="flex h-32 items-end justify-center gap-2">
                {[40, 60, 45, 80, 55, 70, 65].map((height, i) => (
                    <div
                        key={i}
                        className="w-8 rounded-t bg-blue-500"
                        style={{ height: `${height}%` }}
                    />
                ))}
            </div>
        </div>
    );
}

export function DummyTableComponent() {
    return (
        <div className="h-full">
            <h3 className="mb-3 text-lg font-semibold">Dummy Table</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b">
                            <th className="p-2 text-left">Name</th>
                            <th className="p-2 text-right">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {['Item 1', 'Item 2', 'Item 3'].map((item, i) => (
                            <tr key={i} className="border-b">
                                <td className="p-2">{item}</td>
                                <td className="p-2 text-right">{i * 100 + 50}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function DummyCardComponent() {
    return (
        <div className="h-full">
            <h3 className="mb-3 text-lg font-semibold">Dummy Card</h3>
            <div className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 p-4 text-white">
                <div className="text-2xl font-bold">123</div>
                <div className="text-sm opacity-90">Sample Metric</div>
            </div>
        </div>
    );
}

