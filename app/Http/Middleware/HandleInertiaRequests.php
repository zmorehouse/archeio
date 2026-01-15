<?php

namespace App\Http\Middleware;

use App\Models\Player;
use App\Models\PlayerStat;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user() ?? null,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'players' => fn () => Cache::remember('inertia.players', 600, function () {
                return Player::orderBy('name')->get()->map(fn ($player) => [
                    'id' => $player->id,
                    'name' => $player->name,
                ]);
            }),
            'historicalStats' => fn () => $this->getHistoricalStats(),
            'appVersion' => fn () => $this->getLatestVersion(),
        ];
    }

    /**
     * Get historical stats for all players (last 30 days, max 200 stats)
     * Cached for 5 minutes to reduce database load
     */
    protected function getHistoricalStats(): array
    {
        return Cache::remember('inertia.historical_stats', 300, function () {
            $players = Player::all();
            $historicalStats = [];

            foreach ($players as $player) {
                // Limit to 200 most recent stats and 30 days to reduce memory footprint
                $stats = PlayerStat::where('player_id', $player->id)
                    ->where('fetched_at', '>=', now()->subDays(30))
                    ->orderBy('fetched_at', 'desc')
                    ->limit(200)
                    ->select(['fetched_at', 'skills', 'activities'])
                    ->get()
                    ->reverse() // Reverse to get chronological order
                    ->map(function ($stat) {
                        $result = [
                            'fetched_at' => $stat->fetched_at->toIso8601String(),
                            'overall_experience' => $stat->skills['Overall']['experience'] ?? 0,
                            'overall_level' => $stat->skills['Overall']['level'] ?? 0,
                            'skills' => $stat->skills ?? [],
                        ];
                        
                        // Only include activities if they exist and are not empty
                        // This reduces memory usage while still allowing boss kill detection
                        if (!empty($stat->activities) && is_array($stat->activities)) {
                            $result['activities'] = $stat->activities;
                        }
                        
                        return $result;
                    })
                    ->values()
                    ->toArray();
                
                if (!empty($stats)) {
                    $historicalStats[$player->id] = $stats;
                }
                
                unset($stats);
            }

            return $historicalStats;
        });
    }

    /**
     * Get the latest version from CHANGELOG.md
     * Cached for 1 hour
     */
    protected function getLatestVersion(): ?string
    {
        return Cache::remember('app.latest_version', 3600, function () {
            $changelogPath = base_path('CHANGELOG.md');
            
            if (!File::exists($changelogPath)) {
                return null;
            }
            
            $content = File::get($changelogPath);
            
            // Look for version pattern: ## [1.0.3] or ## [1.0.2]
            if (preg_match('/##\s*\[([\d.]+)\]/', $content, $matches)) {
                return $matches[1];
            }
            
            return null;
        });
    }
}
