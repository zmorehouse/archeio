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
                    return [
                        'fetched_at' => $stat->fetched_at->toIso8601String(),
                        'overall_experience' => $stat->skills['Overall']['experience'] ?? 0,
                        'overall_level' => $stat->skills['Overall']['level'] ?? 0,
                        'skills' => $stat->skills ?? [],
                        'activities' => $stat->activities ?? [],
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
