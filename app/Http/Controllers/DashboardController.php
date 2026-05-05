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
     * Downsamples historical stats to reduce memory usage while supporting monthly views:
     * - Last 7 days: Keep every 2nd record (50% reduction)
     * - 7-30 days: Keep every 2nd record (50% reduction) - less aggressive for monthly views
     * - 30-90 days: Keep every 4th record (75% reduction)
     *
     * Only includes essential data: fetched_at, overall_experience, overall_level
     * Skills are included for last 30 days (needed for monthly views), and only essential fields (level, experience)
     * Activities are not included (boss functionality removed to reduce payload size)
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
                }

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
                    'overall_level' => $skills['Overall']['level'] ?? null,
                    'overall_rank' => $skills['Overall']['rank'] ?? null,
                    'overall_experience' => $skills['Overall']['experience'] ?? null,
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
                        ->where('fetched_at', '>=', now()->subDays(90))
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
