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
                        return [
                            'fetched_at' => $stat->fetched_at->toIso8601String(),
                            'overall_experience' => $stat->skills['Overall']['experience'] ?? 0,
                            'overall_level' => $stat->skills['Overall']['level'] ?? 0,
                            'skills' => $stat->skills ?? [],
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
