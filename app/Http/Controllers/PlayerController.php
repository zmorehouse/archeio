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

    public function show(string $player): Response
    {
        $playerModel = Player::where('name', $player)->firstOrFail();

        // Cache player page data for 2 minutes
        $cacheKey = "player.{$playerModel->id}.data";
        $data = Cache::remember($cacheKey, 120, function () use ($playerModel) {
            $latestStat = $playerModel->latestStat();

            return [
                'player' => [
                    'id' => $playerModel->id,
                    'name' => $playerModel->name,
                ],
                'stats' => $latestStat ? [
                    'skills' => $latestStat->skills,
                    'activities' => $latestStat->activities,
                    'fetched_at' => $latestStat->fetched_at->toIso8601String(),
                ] : null,
            ];
        });

        // Defer historical stats to reduce memory usage
        $data['playerHistoricalStats'] = Inertia::defer(function () use ($playerModel) {
            $cacheKey = "player.{$playerModel->id}.historical_stats";

            return Cache::remember($cacheKey, 300, function () use ($playerModel) {
                // Get historical stats for this player (last 90 days) with progressive downsampling
                $stats = PlayerStat::where('player_id', $playerModel->id)
                    ->where('fetched_at', '>=', now()->subDays(90))
                    ->orderBy('fetched_at', 'asc')
                    ->get();

                return $this->downsampleAndProcessStats($stats);
            });
        })->once();

        return Inertia::render('player', $data);
    }
}
