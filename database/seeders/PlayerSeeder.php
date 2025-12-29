<?php

namespace Database\Seeders;

use App\Models\Player;
use Illuminate\Database\Seeder;

class PlayerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $players = [
            'Zoobz69',
            'loub0t69',
            'Melburne6',
            'Alexiisss',
            'JonezyAU',
            'ThyJamison',
            'Chair_Bourne',
            'JoelizKewl',
        ];

        foreach ($players as $playerName) {
            Player::firstOrCreate(
                ['name' => $playerName]
            );
        }
    }
}
