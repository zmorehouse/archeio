<?php

namespace App\Console\Commands;

use App\Models\Player;
use App\Models\PlayerStat;
use App\Services\RuneScapeApiService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class FetchPlayerStats extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'players:fetch-stats';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetch and store player statistics from RuneScape API';

    public function __construct(
        private RuneScapeApiService $runeScapeApiService
    ) {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $players = Player::all();
        $this->info("Fetching stats for {$players->count()} players...");

        $stored = 0;
        $skipped = 0;
        $failed = 0;

        foreach ($players as $player) {
            $this->line("Fetching stats for {$player->name}...");

            $data = $this->runeScapeApiService->fetchPlayerData($player->name);

            if ($data === null) {
                $this->error("  Failed to fetch data for {$player->name}");
                $failed++;
                continue;
            }

            // Create a hash of the data to detect changes
            $dataHash = $this->createDataHash($data);

            // Check if we already have this exact data
            $latestStat = $player->latestStat();
            if ($latestStat && $latestStat->data_hash === $dataHash) {
                $this->line("  No changes detected, skipping...");
                $skipped++;
                continue;
            }

            // Store the new stats
            PlayerStat::create([
                'player_id' => $player->id,
                'skills' => $data['skills'],
                'activities' => $data['activities'],
                'data_hash' => $dataHash,
                'fetched_at' => now(),
            ]);

            $this->info("  Stored new stats for {$player->name}");
            $stored++;

            // Small delay to avoid rate limiting
            usleep(500000); // 0.5 seconds
        }

        $this->newLine();
        $this->info("Completed: {$stored} stored, {$skipped} skipped, {$failed} failed");

        // Clear caches if any stats were stored
        if ($stored > 0) {
            $this->info("Clearing caches...");
            Cache::forget('dashboard.data');
            Cache::forget('inertia.historical_stats');
            Cache::forget('inertia.players');
            
            // Clear all player page caches
            foreach ($players as $player) {
                Cache::forget("player.{$player->id}.data");
                Cache::forget("api.player.{$player->id}.stats");
            }
            $this->info("Caches cleared.");
        }

        return Command::SUCCESS;
    }

    /**
     * Create a hash of the stats data to detect changes
     */
    private function createDataHash(array $data): string
    {
        // Create a normalized copy for hashing
        $normalized = [
            'skills' => $this->sortRecursive($data['skills']),
            'activities' => $this->sortRecursive($data['activities']),
        ];
        
        return hash('sha256', json_encode($normalized));
    }

    /**
     * Recursively sort an array
     */
    private function sortRecursive(array $array): array
    {
        ksort($array);
        foreach ($array as $key => $value) {
            if (is_array($value)) {
                $array[$key] = $this->sortRecursive($value);
            }
        }
        return $array;
    }
}
