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
            // historicalStats removed from global props - only load on pages that need it
            'appVersion' => fn () => $this->getLatestVersion(),
        ];
    }

    /**
     * Downsamples historical stats to reduce memory usage while supporting monthly views:
     * - Last 7 days: Keep every 2nd record (50% reduction)
     * - 7-30 days: Keep every 2nd record (50% reduction) - less aggressive for monthly views
     * - 30-90 days: Keep every 4th record (75% reduction)
     *
     * Only includes essential data: fetched_at, overall_experience, overall_level
     * Skills are included for last 30 days (needed for monthly views), and only essential fields (level, experience)
     * Activities are only included for last 7 days, and only boss-related ones
     */
    protected function downsampleAndProcessStats($stats): array
    {
        $now = now();
        $sevenDaysAgo = $now->copy()->subDays(7);
        $thirtyDaysAgo = $now->copy()->subDays(30);

        $processed = [];
        $index7Days = 0;   // Counter for last 7 days
        $index30Days = 0;  // Counter for 7-30 days period
        $index90Days = 0;  // Counter for 30-90 days period

        foreach ($stats as $stat) {
            $fetchedAt = $stat->fetched_at;

            // Determine which period this stat falls into
            if ($fetchedAt >= $sevenDaysAgo) {
                // Last 7 days: Keep every 2nd record
                $keep = ($index7Days % 2 === 0);
                $index7Days++;
            } elseif ($fetchedAt >= $thirtyDaysAgo) {
                // 7-30 days: Keep every 2nd record (less aggressive for monthly views)
                $keep = ($index30Days % 2 === 0);
                $index30Days++;
            } else {
                // 30-90 days: Keep every 4th record
                $keep = ($index90Days % 4 === 0);
                $index90Days++;
            }

            if ($keep) {
                $statData = [
                    'fetched_at' => $fetchedAt->toIso8601String(),
                    'overall_experience' => $stat->skills['Overall']['experience'] ?? 0,
                    'overall_level' => $stat->skills['Overall']['level'] ?? 0,
                ];

                // Include skills for last 30 days (needed for monthly views) and only essential fields
                if ($fetchedAt >= $thirtyDaysAgo) {
                    $skills = $stat->skills ?? [];
                    $essentialSkills = [];
                    foreach ($skills as $skillName => $skillData) {
                        $essentialSkills[$skillName] = [
                            'level' => $skillData['level'] ?? 0,
                            'experience' => $skillData['experience'] ?? 0,
                        ];
                    }
                    $statData['skills'] = $essentialSkills;

                    // Only include boss activities for last 7 days
                    $activities = $stat->activities ?? [];
                    $bossActivityNames = \App\Services\RuneScapeApiService::getBossActivities();
                    $bossActivities = array_filter($activities, function ($activityName) use ($bossActivityNames) {
                        return in_array($activityName, $bossActivityNames, true);
                    }, ARRAY_FILTER_USE_KEY);

                    // Only include score, not rank, to reduce data size
                    $bossActivitiesMinimal = [];
                    foreach ($bossActivities as $activityName => $activityData) {
                        $bossActivitiesMinimal[$activityName] = [
                            'score' => $activityData['score'] ?? 0,
                        ];
                    }
                    $statData['activities'] = $bossActivitiesMinimal;
                }

                $processed[] = $statData;
            }
        }

        return $processed;
    }

    /**
     * Get historical stats for all players (last 90 days)
     * Cached for 5 minutes to reduce database load
     * Only selects needed columns to reduce memory usage
     */
    protected function getHistoricalStats(): array
    {
        return Cache::remember('inertia.historical_stats', 300, function () {
            $players = Player::select('id')->get();
            $historicalStats = [];

            foreach ($players as $player) {
                $stats = PlayerStat::where('player_id', $player->id)
                    ->where('fetched_at', '>=', now()->subDays(90))
                    ->select('skills', 'activities', 'fetched_at')
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
