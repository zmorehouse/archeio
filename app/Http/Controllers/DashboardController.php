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

            // Only include activities when they exist and are non-empty to reduce memory usage
            $historicalStats = [];
            foreach ($players as $player) {
                // Use select to only load needed columns and reduce memory
                // Limit to 200 most recent stats and 30 days to reduce memory footprint
                $stats = PlayerStat::where('player_id', $player->id)
                    ->where('fetched_at', '>=', now()->subMonths(6))
                    ->orderBy('fetched_at', 'desc')
                    ->select(['fetched_at', 'skills', 'activities'])
                    ->get()
                    ->reverse() // Reverse to get chronological order
                    ->map(function ($stat) {
                        $result = [
                            'fetched_at' => $stat->fetched_at->toIso8601String(),
                            'overall_experience' => $stat->skills['Overall']['experience'] ?? 0,
                            'overall_level' => $stat->skills['Overall']['level'] ?? 0,
                            'skills' => $stat->skills ?? [],
                        ];
                        
                        // Only include activities if they exist and are not empty
                        // This significantly reduces memory usage since most historical stats don't have activities
                        if (!empty($stat->activities) && is_array($stat->activities)) {
                            $result['activities'] = $stat->activities;
                        }
                        
                        return $result;
                    })
                    ->values() // Re-index array to reduce memory
                    ->toArray();
                
                if (!empty($stats)) {
                    $historicalStats[$player->id] = $stats;
                }
                
                // Free memory after processing each player
                unset($stats);
            }
            
            return [
                'players' => $playersWithStats,
                'historicalStats' => $historicalStats,
            ];
        });
        
        return Inertia::render('dashboard', $data);
    }
}
