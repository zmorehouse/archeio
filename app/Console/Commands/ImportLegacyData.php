<?php

namespace App\Console\Commands;

use App\Models\Player;
use App\Models\PlayerStat;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class ImportLegacyData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'import:legacy-data 
                            {--players= : Path to Player_rows.csv file}
                            {--snapshots= : Path to Snapshot_rows.csv file}
                            {--clear : Clear existing data before importing}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import legacy player and snapshot data from CSV files';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $playersPath = $this->option('players');
        $snapshotsPath = $this->option('snapshots');

        if (!$playersPath || !$snapshotsPath) {
            $this->error('Please provide both --players and --snapshots file paths');
            $this->info('Usage: php artisan import:legacy-data --players=/path/to/Player_rows.csv --snapshots=/path/to/Snapshot_rows.csv');
            return Command::FAILURE;
        }

        if (!File::exists($playersPath)) {
            $this->error("Players file not found: {$playersPath}");
            return Command::FAILURE;
        }

        if (!File::exists($snapshotsPath)) {
            $this->error("Snapshots file not found: {$snapshotsPath}");
            return Command::FAILURE;
        }

        if ($this->option('clear')) {
            if (!$this->confirm('This will delete all existing players and stats. Are you sure?')) {
                $this->info('Import cancelled.');
                return Command::FAILURE;
            }
            $this->info('Clearing existing data...');
            PlayerStat::truncate();
            Player::truncate();
            $this->info('Existing data cleared.');
        }

        $this->info('Starting import...');
        $this->newLine();

        // Import players
        $this->info('Importing players...');
        $playersImported = $this->importPlayers($playersPath);
        $this->info("Imported {$playersImported} players.");
        $this->newLine();

        // Import snapshots
        $this->info('Importing snapshots...');
        $snapshotsImported = $this->importSnapshots($snapshotsPath);
        $this->info("Imported {$snapshotsImported} snapshots.");
        $this->newLine();

        // Clear caches
        $this->info('Clearing caches...');
        \Illuminate\Support\Facades\Cache::flush();
        $this->info('Caches cleared.');
        $this->newLine();

        $this->info('Import completed successfully!');
        return Command::SUCCESS;
    }

    /**
     * Import players from CSV
     */
    private function importPlayers(string $filePath): int
    {
        $handle = fopen($filePath, 'r');
        if (!$handle) {
            $this->error("Could not open file: {$filePath}");
            return 0;
        }

        // Read header
        $header = fgetcsv($handle);
        if (!$header || $header[0] !== 'id' || $header[1] !== 'username' || $header[2] !== 'createdAt') {
            $this->error('Invalid CSV format. Expected: id,username,createdAt');
            fclose($handle);
            return 0;
        }

        $imported = 0;
        $playerIdMap = []; // Map old ID to new ID

        // Skip header and import rows
        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) < 3) continue;

            $oldId = (int) $row[0];
            $username = trim($row[1]);
            $createdAt = $row[2];

            if (empty($username)) continue;

            // Check if player already exists by name
            $player = Player::where('name', $username)->first();

            if (!$player) {
                $player = Player::create([
                    'name' => $username,
                    'created_at' => $this->parseDateTime($createdAt),
                    'updated_at' => $this->parseDateTime($createdAt),
                ]);
                $imported++;
            }

            // Map old ID to new ID
            $playerIdMap[$oldId] = $player->id;
        }

        fclose($handle);

        // Store the mapping in a temporary file for snapshot import
        $mappingFile = storage_path('app/player_id_mapping.json');
        File::put($mappingFile, json_encode($playerIdMap));

        return $imported;
    }

    /**
     * Import snapshots from CSV
     */
    private function importSnapshots(string $filePath): int
    {
        // Load player ID mapping
        $mappingFile = storage_path('app/player_id_mapping.json');
        if (!File::exists($mappingFile)) {
            $this->error('Player ID mapping not found. Please import players first.');
            return 0;
        }

        $playerIdMap = json_decode(File::get($mappingFile), true);

        $handle = fopen($filePath, 'r');
        if (!$handle) {
            $this->error("Could not open file: {$filePath}");
            return 0;
        }

        // Read header
        $header = fgetcsv($handle);
        if (!$header || $header[0] !== 'id' || $header[1] !== 'playerId' || $header[2] !== 'data' || $header[3] !== 'recordedAt') {
            $this->error('Invalid CSV format. Expected: id,playerId,data,recordedAt');
            fclose($handle);
            return 0;
        }

        $imported = 0;
        $skipped = 0;
        $batch = [];
        $batchSize = 100;

        // Skip header and import rows
        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) < 4) continue;

            $oldPlayerId = (int) $row[1];
            $dataJson = $row[2];
            $recordedAt = $row[3];

            // Map old player ID to new player ID
            if (!isset($playerIdMap[$oldPlayerId])) {
                $skipped++;
                continue;
            }

            $newPlayerId = $playerIdMap[$oldPlayerId];

            // Parse JSON data
            $data = json_decode($dataJson, true);
            if (!$data || !isset($data['skills'])) {
                $skipped++;
                continue;
            }

            // Transform skills data to match current format
            $skills = [];
            $skillNameMap = [
                'Runecraft' => 'Runecrafting', // Map old name to new name
            ];
            
            foreach ($data['skills'] as $skillName => $skillData) {
                // Map skill name if needed
                $mappedSkillName = $skillNameMap[$skillName] ?? $skillName;
                
                $skills[$mappedSkillName] = [
                    'rank' => $skillData['rank'] ?? -1,
                    'level' => $skillData['level'] ?? 0,
                    'experience' => $skillData['xp'] ?? 0,
                ];
            }

            // Generate data hash (same logic as FetchPlayerStats)
            $dataHash = $this->createDataHash([
                'skills' => $skills,
                'activities' => [],
            ]);

            // Check if this exact snapshot already exists
            $exists = PlayerStat::where('player_id', $newPlayerId)
                ->where('data_hash', $dataHash)
                ->where('fetched_at', $this->parseDateTime($recordedAt))
                ->exists();

            if ($exists) {
                $skipped++;
                continue;
            }

            $batch[] = [
                'player_id' => $newPlayerId,
                'skills' => json_encode($skills),
                'activities' => json_encode([]),
                'data_hash' => $dataHash,
                'fetched_at' => $this->parseDateTime($recordedAt),
                'created_at' => now(),
                'updated_at' => now(),
            ];

            // Insert in batches for performance
            if (count($batch) >= $batchSize) {
                PlayerStat::insert($batch);
                $imported += count($batch);
                $batch = [];
                $this->line("  Processed {$imported} snapshots...");
            }
        }

        // Insert remaining batch
        if (!empty($batch)) {
            PlayerStat::insert($batch);
            $imported += count($batch);
        }

        fclose($handle);

        // Clean up mapping file
        File::delete($mappingFile);

        if ($skipped > 0) {
            $this->warn("Skipped {$skipped} snapshots (duplicates or invalid data).");
        }

        return $imported;
    }

    /**
     * Create a hash of the stats data to detect changes
     */
    private function createDataHash(array $data): string
    {
        // Create a normalized copy for hashing
        $normalized = [
            'skills' => $this->sortRecursive($data['skills']),
            'activities' => $this->sortRecursive($data['activities'] ?? []),
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

    /**
     * Parse datetime string to Carbon instance
     */
    private function parseDateTime(string $dateTime): \Carbon\Carbon
    {
        try {
            return \Carbon\Carbon::parse($dateTime);
        } catch (\Exception $e) {
            $this->warn("Invalid date format: {$dateTime}, using current time");
            return now();
        }
    }
}

