<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RuneScapeApiService
{
    private const BASE_URL = 'https://secure.runescape.com/m=hiscore_oldschool';

    private const SKILLS = [
        'Overall',
        'Attack',
        'Defence',
        'Strength',
        'Hitpoints',
        'Ranged',
        'Prayer',
        'Magic',
        'Cooking',
        'Woodcutting',
        'Fletching',
        'Fishing',
        'Firemaking',
        'Crafting',
        'Smithing',
        'Mining',
        'Herblore',
        'Agility',
        'Thieving',
        'Slayer',
        'Farming',
        'Runecrafting',
        'Hunter',
        'Construction',
        'Sailing',
    ];

    /**
     * Fetch player hiscores data from RuneScape API
     */
    public function fetchPlayerData(string $playerName): ?array
    {
        try {
            $response = Http::timeout(10)->get(
                self::BASE_URL.'/index_lite.ws',
                ['player' => $playerName]
            );

            if (! $response->successful()) {
                Log::warning("Failed to fetch data for player: {$playerName}", [
                    'status' => $response->status(),
                ]);

                return null;
            }

            $data = $response->body();

            if (empty($data)) {
                return null;
            }

            return $this->parseHiscoresData($data);
        } catch (\Exception $e) {
            Log::error("Error fetching RuneScape data for player: {$playerName}", [
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Parse the CSV hiscores data into structured format
     */
    private function parseHiscoresData(string $data): array
    {
        $lines = explode("\n", trim($data));
        $parsed = [
            'skills' => [],
        ];

        $skillCount = count(self::SKILLS);

        // Parse skills
        for ($i = 0; $i < $skillCount && $i < count($lines); $i++) {
            $values = explode(',', trim($lines[$i]));
            $parsed['skills'][self::SKILLS[$i]] = [
                'rank' => (int) ($values[0] ?? -1),
                'level' => (int) ($values[1] ?? 0),
                'experience' => (int) ($values[2] ?? 0),
            ];
        }

        return $parsed;
    }
}
