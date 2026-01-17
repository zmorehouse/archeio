<?php

namespace App\Http\Controllers;

use App\Models\Player;
use App\Models\PlayerStat;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        // Cache dashboard data for 2 minutes
        $cacheKey = 'dashboard.data';
        $data = Cache::remember($cacheKey, 120, function () {
            $players = Player::orderBy('name')->get();
            
            $playersWithStats = $players->map(function ($player) {
                $latestStat = $player->latestStat();
                
                return [
                    'id' => $player->id,
                    'name' => $player->name,
                    'overall_level' => $latestStat?->skills['Overall']['level'] ?? null,
                    'overall_rank' => $latestStat?->skills['Overall']['rank'] ?? null,
                    'overall_experience' => $latestStat?->skills['Overall']['experience'] ?? null,
                    'last_updated' => $latestStat?->fetched_at?->toIso8601String(),
                    'skills' => $latestStat?->skills ?? [],
                    'activities' => $latestStat?->activities ?? [],
                ];
            });

            // Get historical stats for all players (last 90 days)
            $historicalStats = [];
            foreach ($players as $player) {
                $stats = PlayerStat::where('player_id', $player->id)
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
                
                if (!empty($stats)) {
                    $historicalStats[$player->id] = $stats;
                }
            }
            
            return [
                'players' => $playersWithStats,
                'historicalStats' => $historicalStats,
            ];
        });
        
        return Inertia::render('dashboard', $data);
    }
}
