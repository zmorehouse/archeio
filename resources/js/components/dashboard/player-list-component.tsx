import { Link } from '@inertiajs/react';

interface Player {
    id: number;
    name: string;
    overall_level: number | null;
    overall_rank: number | null;
    overall_experience: number | null;
}

interface PlayerListComponentProps {
    players: Player[];
}

export function PlayerListComponent({ players }: PlayerListComponentProps) {
    return (
        <div className="h-full">
            <h3 className="mb-3 text-lg font-semibold">Player List</h3>
            <div className="space-y-2">
                {players.map((player) => (
                    <Link
                        key={player.id}
                        href={`/players/${player.name}`}
                        className="block rounded-lg border border-sidebar-border/70 p-3 transition-colors hover:bg-neutral-50 dark:border-sidebar-border dark:hover:bg-neutral-800"
                    >
                        <div className="flex items-center justify-between">
                            <span className="font-medium">{player.name}</span>
                            {player.overall_level !== null && (
                                <span className="text-lg font-bold">
                                    {player.overall_level}
                                </span>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

