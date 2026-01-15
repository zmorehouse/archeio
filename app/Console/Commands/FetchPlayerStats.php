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
        $batch = [];
        $batchSize = 10; // Insert in batches of 10 for better performance

        foreach ($players as $player) {
            $this->line("Fetching stats for {$player->name}...");

            $data = $this->runeScapeApiService->fetchPlayerData($player->name);

            if ($data === null) {
                $this->error("  Failed to fetch data for {$player->name}");
                $failed++;
                continue;
            }

            // Create a hash of the data to detect changes (optimized)
            $dataHash = $this->createDataHash($data);

            // Check if we already have this exact data
            $latestStat = $player->latestStat();
            if ($latestStat && $latestStat->data_hash === $dataHash) {
                $this->line("  No changes detected, skipping...");
                $skipped++;
                continue;
            }

            // Prepare batch insert data
            $batch[] = [
                'player_id' => $player->id,
                'skills' => json_encode($data['skills']), // Pre-encode to avoid Eloquent overhead
                'activities' => json_encode($data['activities'] ?? []),
                'data_hash' => $dataHash,
                'fetched_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ];

            $stored++;

            // Insert in batches for better performance
            if (count($batch) >= $batchSize) {
                PlayerStat::insert($batch);
                $this->info("  Stored batch of " . count($batch) . " stats");
                $batch = [];
            }

            // Small delay to avoid rate limiting
            usleep(500000); // 0.5 seconds
        }

        // Insert remaining batch
        if (!empty($batch)) {
            PlayerStat::insert($batch);
            $this->info("  Stored final batch of " . count($batch) . " stats");
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
     * Optimized to avoid expensive recursive sorting - just hash the JSON directly
     */
    private function createDataHash(array $data): string
    {
        // Only hash skills and activities - no need for expensive recursive sorting
        // JSON encoding is deterministic for associative arrays with string keys
        $toHash = [
            'skills' => $data['skills'] ?? [],
            'activities' => $data['activities'] ?? [],
        ];
        
        // Use JSON_UNESCAPED_SLASHES and JSON_UNESCAPED_UNICODE for consistency
        // and slightly better performance
        return hash('sha256', json_encode($toHash, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    }
}
