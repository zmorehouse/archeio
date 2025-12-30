<?php

namespace App\Console\Commands;

use App\Models\Player;
use Illuminate\Console\Command;

class AddPlayers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'players:add {names* : The names of the players to add}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Add one or more players to track';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $names = $this->argument('names');

        if (empty($names)) {
            $this->error('Please provide at least one player name.');
            return 1;
        }

        $added = 0;
        $skipped = 0;

        foreach ($names as $name) {
            $player = Player::firstOrCreate(['name' => $name]);

            if ($player->wasRecentlyCreated) {
                $this->info("Added player: {$name}");
                $added++;
            } else {
                $this->line("Player already exists: {$name}");
                $skipped++;
            }
        }

        $this->newLine();
        $this->info("Completed: {$added} added, {$skipped} already existed");

        return 0;
    }
}

