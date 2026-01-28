<?php

namespace App\Http\Controllers;

use App\Models\Player;
use App\Models\PlayerStat;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class PlayerController extends Controller
{
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

    public function show(string $player): Response
    {
        $playerModel = Player::select('id', 'name')->where('name', $player)->firstOrFail();

        // Cache player page data for 2 minutes
        $cacheKey = "player.{$playerModel->id}.data";
        $data = Cache::remember($cacheKey, 120, function () use ($playerModel) {
            $latestStat = PlayerStat::where('player_id', $playerModel->id)
                ->select('skills', 'activities', 'fetched_at')
                ->orderBy('fetched_at', 'desc')
                ->first();

            if (! $latestStat) {
                return [
                    'player' => [
                        'id' => $playerModel->id,
                        'name' => $playerModel->name,
                    ],
                    'stats' => null,
                ];
            }

            $skills = $latestStat->skills ?? [];
            $activities = $latestStat->activities ?? [];

            // Only include essential skill data (level, experience, rank)
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
                'player' => [
                    'id' => $playerModel->id,
                    'name' => $playerModel->name,
                ],
                'stats' => [
                    'skills' => $essentialSkills,
                    'activities' => $bossActivitiesWithRank,
                    'fetched_at' => $latestStat->fetched_at->toIso8601String(),
                ],
            ];
        });

        // Defer historical stats to reduce memory usage
        $data['playerHistoricalStats'] = Inertia::defer(function () use ($playerModel) {
            $cacheKey = "player.{$playerModel->id}.historical_stats";

            return Cache::remember($cacheKey, 300, function () use ($playerModel) {
                // Get historical stats for this player (last 90 days) with aggressive downsampling
                $stats = PlayerStat::where('player_id', $playerModel->id)
                    ->where('fetched_at', '>=', now()->subDays(90))
                    ->select('skills', 'activities', 'fetched_at')
                    ->orderBy('fetched_at', 'asc')
                    ->get();

                return $this->downsampleAndProcessStats($stats);
            });
        })->once();

        return Inertia::render('player', $data);
    }
}
