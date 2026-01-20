<?php

namespace App\Http\Middleware;

use App\Models\Player;
use App\Models\PlayerStat;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
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
     * Enable history encryption to compress large state objects and prevent
     * NS_ERROR_ILLEGAL_VALUE errors in Firefox when history state is too large.
     *
     * @see https://inertiajs.com/security/history-encryption
     */
    public function encryptHistory(Request $request): bool
    {
        return true;
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
            'historicalStats' => Inertia::defer(fn () => $this->getHistoricalStats())->once(),
            'appVersion' => fn () => $this->getLatestVersion(),
        ];
    }

    /**
     * Downsamples historical stats progressively to reduce memory usage:
     * - Last 14 days: Keep all records (full resolution for activity detection)
     * - 14-30 days: Keep every 2nd record (50% reduction)
     * - 30-90 days: Keep every 4th record (75% reduction)
     *
     * Also filters activities to only boss-related ones for recent stats (last 14 days)
     */
    protected function downsampleAndProcessStats($stats): array
    {
        $now = now();
        $fourteenDaysAgo = $now->copy()->subDays(14);
        $thirtyDaysAgo = $now->copy()->subDays(30);

        $processed = [];
        $index14Days = 0;  // Counter for 14-30 days period
        $index30Days = 0;  // Counter for 30-90 days period

        foreach ($stats as $stat) {
            $fetchedAt = $stat->fetched_at;

            // Determine which period this stat falls into
            if ($fetchedAt >= $fourteenDaysAgo) {
                // Last 14 days: Keep all records (needed for activity detection)
                $keep = true;
            } elseif ($fetchedAt >= $thirtyDaysAgo) {
                // 14-30 days: Keep every 2nd record
                $keep = ($index14Days % 2 === 0);
                $index14Days++;
            } else {
                // 30-90 days: Keep every 4th record
                $keep = ($index30Days % 4 === 0);
                $index30Days++;
            }

            if ($keep) {
                $statData = [
                    'fetched_at' => $fetchedAt->toIso8601String(),
                    'overall_experience' => $stat->skills['Overall']['experience'] ?? 0,
                    'overall_level' => $stat->skills['Overall']['level'] ?? 0,
                    'skills' => $stat->skills ?? [],
                ];

                // Only include activities for recent stats (last 14 days) to reduce memory usage
                if ($fetchedAt >= $now->copy()->subDays(14)) {
                    // Filter activities to only boss-related ones
                    $activities = $stat->activities ?? [];
                    $bossActivities = array_filter($activities, function ($activityName) {
                        $lowerName = strtolower($activityName);

                        return str_contains($lowerName, 'boss') ||
                            str_contains($lowerName, 'kill') ||
                            str_contains($lowerName, 'chest') ||
                            str_contains($lowerName, 'chambers') ||
                            str_contains($lowerName, 'theatre') ||
                            str_contains($lowerName, 'inferno') ||
                            str_contains($lowerName, 'gauntlet') ||
                            str_contains($lowerName, 'nightmare') ||
                            str_contains($lowerName, 'nex') ||
                            str_contains($lowerName, 'zulrah') ||
                            str_contains($lowerName, 'vorkath') ||
                            str_contains($lowerName, 'cerberus') ||
                            str_contains($lowerName, 'kraken') ||
                            str_contains($lowerName, 'sire') ||
                            str_contains($lowerName, 'hydra') ||
                            str_contains($lowerName, 'barrows') ||
                            str_contains($lowerName, 'corp') ||
                            str_contains($lowerName, 'zilyana') ||
                            str_contains($lowerName, 'bandos') ||
                            str_contains($lowerName, 'armadyl') ||
                            str_contains($lowerName, 'saradomin') ||
                            str_contains($lowerName, 'zamorak');
                    }, ARRAY_FILTER_USE_KEY);
                    $statData['activities'] = $bossActivities;
                }

                $processed[] = $statData;
            }
        }

        return $processed;
    }

    /**
     * Get historical stats for all players (last 90 days)
     * Cached for 5 minutes to reduce database load
     */
    protected function getHistoricalStats(): array
    {
        return Cache::remember('inertia.historical_stats', 300, function () {
            $players = Player::all();
            $historicalStats = [];

            foreach ($players as $player) {
                $stats = PlayerStat::where('player_id', $player->id)
                    ->where('fetched_at', '>=', now()->subDays(90))
                    ->orderBy('fetched_at', 'asc')
                    ->get();

                $processedStats = $this->downsampleAndProcessStats($stats);

                if (! empty($processedStats)) {
                    $historicalStats[$player->id] = $processedStats;
                }
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

            if (! File::exists($changelogPath)) {
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
