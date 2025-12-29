<?php

namespace App\Http\Controllers\Api;

use App\Console\Commands\FetchPlayerStats;
use App\Http\Controllers\Controller;
use App\Models\Player;
use App\Services\RuneScapeApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;

class PlayerController extends Controller
{
    public function __construct(
        private RuneScapeApiService $runeScapeApiService
    ) {}

    /**
     * Get all players
     * Cached for 10 minutes
     */
    public function index(): JsonResponse
    {
        $players = Cache::remember('api.players', 600, function () {
            return Player::orderBy('name')->get();
        });
        
        return response()->json([
            'data' => $players,
        ]);
    }

    /**
     * Get a specific player
     */
    public function show(string $player): JsonResponse
    {
        $playerModel = Player::where('name', $player)->firstOrFail();
        
        return response()->json([
            'data' => $playerModel,
        ]);
    }

    /**
     * Get player statistics from RuneScape API
     * Cached for 5 minutes to reduce API calls
     */
    public function stats(string $player): JsonResponse
    {
        $playerModel = Player::where('name', $player)->firstOrFail();
        
        $cacheKey = "api.player.{$playerModel->id}.stats";
        $data = Cache::remember($cacheKey, 300, function () use ($playerModel) {
            return $this->runeScapeApiService->fetchPlayerData($playerModel->name);
        });
        
        if ($data === null) {
            return response()->json([
                'message' => 'Failed to fetch player data from RuneScape API',
            ], 503);
        }
        
        return response()->json([
            'player' => $playerModel->name,
            'data' => $data,
        ]);
    }

    /**
     * Force refresh all player statistics
     * Clears all relevant caches after refresh
     */
    public function refresh(): JsonResponse
    {
        try {
            Artisan::call('players:fetch-stats');
            $output = Artisan::output();

            // Clear all relevant caches
            Cache::forget('dashboard.data');
            Cache::forget('inertia.historical_stats');
            Cache::forget('inertia.players');
            
            // Clear all player page caches
            $players = Player::all();
            foreach ($players as $player) {
                Cache::forget("player.{$player->id}.data");
                Cache::forget("api.player.{$player->id}.stats");
            }

            return response()->json([
                'message' => 'Player statistics refresh initiated',
                'output' => $output,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to refresh player statistics',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
