<?php

namespace App\Http\Middleware;

use App\Models\Player;
use App\Models\PlayerStat;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
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
            'appVersion' => fn () => '1.0.9',
        ];
    }

    /**
     * Downsamples historical stats to reduce memory usage while supporting monthly/yearly views.
     *
     * Returned payload includes only:
     * - fetched_at
     * - overall_experience
     * - overall_level
     * - skills (level + experience only)
     *
     * Activities are not included (boss functionality removed).
     */
    protected function downsampleAndProcessStats($stats): array
    {
        $now = now();
        $sevenDaysAgo = $now->copy()->subDays(7);
        $thirtyDaysAgo = $now->copy()->subDays(30);
        $ninetyDaysAgo = $now->copy()->subDays(90);

        $processed = [];
        $index7Days = 0;   // Counter for last 7 days
        $index30Days = 0;  // Counter for 7-30 days period
        $index90Days = 0;  // Counter for 30-90 days period
        $indexYear = 0;    // Counter for 90d-1y period

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
            } elseif ($fetchedAt >= $ninetyDaysAgo) {
                // 30-90 days: Keep every 4th record
                $keep = ($index90Days % 4 === 0);
                $index90Days++;
            } else {
                // 90d-1y: Keep every 7th record (weekly-ish)
                $keep = ($indexYear % 7 === 0);
                $indexYear++;
            }

            if ($keep) {
                $skills = $stat->skills ?? [];
                $overallExperience = $skills['Overall']['experience'] ?? null;
                $overallLevel = $skills['Overall']['level'] ?? null;

                if ($overallExperience === null || $overallLevel === null) {
                    $overallExperience = 0;
                    $overallLevel = 0;

                    foreach ($skills as $skillName => $skillData) {
                        if ($skillName === 'Overall') {
                            continue;
                        }

                        $overallExperience += $skillData['experience'] ?? 0;
                        $overallLevel += $skillData['level'] ?? 0;
                    }
                }

                $statData = [
                    'fetched_at' => $fetchedAt->toIso8601String(),
                    'overall_experience' => $overallExperience,
                    'overall_level' => $overallLevel,
                ];

                // Always include essential skills (needed for breakdown charts across all periods)
                $essentialSkills = [];
                foreach ($skills as $skillName => $skillData) {
                    $essentialSkills[$skillName] = [
                        'level' => $skillData['level'] ?? 0,
                        'experience' => $skillData['experience'] ?? 0,
                    ];
                }
                $statData['skills'] = $essentialSkills;

                $processed[] = $statData;
            }
        }

        return $processed;
    }

    /**
     * Get historical stats for all players (last year)
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
                    ->where('fetched_at', '>=', now()->subYear())
                    ->select('skills', 'fetched_at')
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
}
