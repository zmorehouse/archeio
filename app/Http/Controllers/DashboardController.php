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
     * Downsamples historical stats aggressively to reduce memory usage:
     * - Last 7 days: Keep every 2nd record (50% reduction)
     * - 7-30 days: Keep every 4th record (75% reduction)
     * - 30-90 days: Keep every 8th record (87.5% reduction)
     *
     * Only includes essential data: fetched_at, overall_experience, overall_level
     * Skills are only included for last 7 days, and only essential fields (level, experience)
     * Activities are only included for last 7 days, and only boss-related ones
     */
    protected function downsampleAndProcessStats($stats): array
    {
        $now = now();
        $sevenDaysAgo = $now->copy()->subDays(7);
        $thirtyDaysAgo = $now->copy()->subDays(30);

        $processed = [];
        $index7Days = 0;   // Counter for 7-30 days period
        $index30Days = 0;  // Counter for 30-90 days period

        foreach ($stats as $stat) {
            $fetchedAt = $stat->fetched_at;

            // Determine which period this stat falls into
            if ($fetchedAt >= $sevenDaysAgo) {
                // Last 7 days: Keep every 2nd record
                $keep = ($index7Days % 2 === 0);
                $index7Days++;
            } elseif ($fetchedAt >= $thirtyDaysAgo) {
                // 7-30 days: Keep every 4th record
                $keep = ($index30Days % 4 === 0);
                $index30Days++;
            } else {
                // 30-90 days: Keep every 8th record
                $keep = ($index30Days % 8 === 0);
                $index30Days++;
            }

            if ($keep) {
                $statData = [
                    'fetched_at' => $fetchedAt->toIso8601String(),
                    'overall_experience' => $stat->skills['Overall']['experience'] ?? 0,
                    'overall_level' => $stat->skills['Overall']['level'] ?? 0,
                ];

                // Only include skills for recent stats (last 7 days) and only essential fields
                if ($fetchedAt >= $sevenDaysAgo) {
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

    public function index(): Response
    {
        // Cache dashboard data for 2 minutes
        $cacheKey = 'dashboard.data';
        $data = Cache::remember($cacheKey, 120, function () {
            $players = Player::select('id', 'name')->orderBy('name')->get();

            $playersWithStats = $players->map(function ($player) {
                $latestStat = PlayerStat::where('player_id', $player->id)
                    ->select('skills', 'activities', 'fetched_at')
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
                $activities = $latestStat->activities ?? [];

                // Include essential skill data (level, experience, rank for all skills - needed for rankings component)
                $essentialSkills = [];
                foreach ($skills as $skillName => $skillData) {
                    $essentialSkills[$skillName] = [
                        'level' => $skillData['level'] ?? 0,
                        'experience' => $skillData['experience'] ?? 0,
                        'rank' => $skillData['rank'] ?? null,
                    ];
                }

                // Only include boss activities - keep rank for latest stats (needed for display)
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

                // Keep rank for latest stats (needed for display)
                $bossActivitiesWithRank = [];
                foreach ($bossActivities as $activityName => $activityData) {
                    $bossActivitiesWithRank[$activityName] = [
                        'score' => $activityData['score'] ?? 0,
                        'rank' => $activityData['rank'] ?? -1,
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
                    'activities' => $bossActivitiesWithRank,
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
        })->once();

        return Inertia::render('dashboard', $data);
    }
}
