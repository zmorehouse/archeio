<?php

namespace App\Http\Controllers;

use App\Models\Player;
use App\Models\PlayerStat;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
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

    public function index(): Response
    {
        // Cache dashboard data for 2 minutes
        $cacheKey = 'dashboard.data';
        $data = Cache::remember($cacheKey, 120, function () {
            $players = Player::select('id', 'name')->orderBy('name')->get();

            $playersWithStats = $players->map(function ($player) {
                $latestStat = PlayerStat::where('player_id', $player->id)
                    ->select('skills', 'fetched_at')
                    ->orderBy('fetched_at', 'desc')
                    ->first();

                if (! $latestStat) {
                    return [
                        'id' => $player->id,
                        'name' => $player->name,
                        'overall_level' => null,
                        'overall_rank' => null,
                        'overall_experience' => null,
                        'last_updated' => null,
                    ];
                }

                $skills = $latestStat->skills ?? [];

                // Include essential skill data (level, experience, rank for all skills - needed for rankings component)
                $essentialSkills = [];
                foreach ($skills as $skillName => $skillData) {
                    $essentialSkills[$skillName] = [
                        'level' => $skillData['level'] ?? 0,
                        'experience' => $skillData['experience'] ?? 0,
                        'rank' => $skillData['rank'] ?? null,
                    ];
                }

                return [
                    'id' => $player->id,
                    'name' => $player->name,
                    'overall_level' => $skills['Overall']['level'] ?? array_sum(array_map(
                        fn (array $skillData): int => $skillData['level'] ?? 0,
                        array_filter($skills, fn (string $skillName): bool => $skillName !== 'Overall', ARRAY_FILTER_USE_KEY)
                    )),
                    'overall_rank' => $skills['Overall']['rank'] ?? null,
                    'overall_experience' => $skills['Overall']['experience'] ?? array_sum(array_map(
                        fn (array $skillData): int => $skillData['experience'] ?? 0,
                        array_filter($skills, fn (string $skillName): bool => $skillName !== 'Overall', ARRAY_FILTER_USE_KEY)
                    )),
                    'last_updated' => $latestStat->fetched_at?->toIso8601String(),
                    'skills' => $essentialSkills,
                ];
            });

            return [
                'players' => $playersWithStats,
            ];
        });

        // Defer historical stats to reduce initial memory usage
        $data['historicalStats'] = Inertia::defer(function () {
            $cacheKey = 'dashboard.historical_stats';

            return Cache::remember($cacheKey, 300, function () {
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
        })->once();

        return Inertia::render('dashboard', $data);
    }
}
