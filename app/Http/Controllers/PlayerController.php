<?php

namespace App\Http\Controllers;

use App\Models\Player;
use App\Models\PlayerStat;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class PlayerController extends Controller
{
    public function show(string $player): Response
    {
        $playerModel = Player::where('name', $player)->firstOrFail();
        
        // Cache player page data for 2 minutes
        $cacheKey = "player.{$playerModel->id}.data";
        $data = Cache::remember($cacheKey, 120, function () use ($playerModel) {
            $latestStat = $playerModel->latestStat();

            // Get historical stats for this player (last 90 days)
            $historicalStats = PlayerStat::where('player_id', $playerModel->id)
                ->where('fetched_at', '>=', now()->subDays(90))
                ->orderBy('fetched_at', 'asc')
                ->get()
                ->map(function ($stat) {
                    // Filter activities to only boss-related ones to reduce memory usage
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
                    
                    return [
                        'fetched_at' => $stat->fetched_at->toIso8601String(),
                        'overall_experience' => $stat->skills['Overall']['experience'] ?? 0,
                        'overall_level' => $stat->skills['Overall']['level'] ?? 0,
                        'skills' => $stat->skills ?? [],
                        'activities' => $bossActivities,
                    ];
                })
                ->toArray();

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
                'playerHistoricalStats' => $historicalStats,
            ];
        });

        return Inertia::render('player', $data);
    }
}
