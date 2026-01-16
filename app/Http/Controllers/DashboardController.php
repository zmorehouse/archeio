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

            // Smart aggregation strategy to reduce memory while supporting all views:
            // - Last 30 days: Keep all records (needed for daily/weekly/monthly views)
            // - 30 days to 6 months: Aggregate to one record per day (last record of each day)
            $historicalStats = [];
            $thirtyDaysAgo = now()->subDays(30);
            $sixMonthsAgo = now()->subMonths(6);
            
            foreach ($players as $player) {
                // Fetch all records from last 30 days (detailed data for short-term views)
                $recentStats = PlayerStat::where('player_id', $player->id)
                    ->where('fetched_at', '>=', $thirtyDaysAgo)
                    ->orderBy('fetched_at', 'asc')
                    ->select(['fetched_at', 'skills', 'activities'])
                    ->get();
                
                // For older data (30 days to 6 months), fetch with limit and aggregate in PHP
                // Limit to prevent memory issues, then aggregate to one per day
                $olderStats = PlayerStat::where('player_id', $player->id)
                    ->where('fetched_at', '>=', $sixMonthsAgo)
                    ->where('fetched_at', '<', $thirtyDaysAgo)
                    ->orderBy('fetched_at', 'desc')
                    ->limit(2000) // Reasonable limit for ~150 days
                    ->select(['fetched_at', 'skills', 'activities'])
                    ->get();
                
                // Aggregate older stats to one record per day (keep the last record of each day)
                $aggregatedByDay = [];
                foreach ($olderStats as $stat) {
                    $dayKey = $stat->fetched_at->format('Y-m-d');
                    // Keep the latest record for each day
                    if (!isset($aggregatedByDay[$dayKey]) || 
                        $stat->fetched_at->gt($aggregatedByDay[$dayKey]->fetched_at)) {
                        $aggregatedByDay[$dayKey] = $stat;
                    }
                }
                $aggregatedStats = collect(array_values($aggregatedByDay))->sortBy('fetched_at');
                
                // Merge recent and aggregated stats, then process
                $allStats = $recentStats->concat($aggregatedStats)
                    ->sortBy('fetched_at')
                    ->map(function ($stat) {
                        $result = [
                            'fetched_at' => $stat->fetched_at->toIso8601String(),
                            'overall_experience' => $stat->skills['Overall']['experience'] ?? 0,
                            'overall_level' => $stat->skills['Overall']['level'] ?? 0,
                            'skills' => $stat->skills ?? [],
                        ];
                        
                        // Only include activities if they exist and are not empty
                        if (!empty($stat->activities) && is_array($stat->activities)) {
                            $result['activities'] = $stat->activities;
                        }
                        
                        return $result;
                    })
                    ->values()
                    ->toArray();
                
                if (!empty($allStats)) {
                    $historicalStats[$player->id] = $allStats;
                }
                
                // Free memory after processing each player
                unset($recentStats, $olderStats, $aggregatedByDay, $aggregatedStats, $allStats);
            }
            
            return [
                'players' => $playersWithStats,
                'historicalStats' => $historicalStats,
            ];
        });
        
        return Inertia::render('dashboard', $data);
    }
}
