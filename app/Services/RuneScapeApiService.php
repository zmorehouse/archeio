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
    
    private const ACTIVITIES = [
        'Grid Points',
        'League Points',
        'Deadman Points',
        'Bounty Hunter - Hunter',
        'Bounty Hunter - Rogue',
        'Bounty Hunter (Legacy) - Hunter',
        'Bounty Hunter (Legacy) - Rogue',
        'Clue Scrolls (all)',
        'Clue Scrolls (beginner)',
        'Clue Scrolls (easy)',
        'Clue Scrolls (medium)',
        'Clue Scrolls (hard)',
        'Clue Scrolls (elite)',
        'Clue Scrolls (master)',
        'LMS - Rank',
        'PvP Arena - Rank',
        'Soul Wars Zeal',
        'Rifts closed',
        'Colosseum Glory',
        'Collections Logged',
        'Abyssal Sire',
        'Alchemical Hydra',
        'Amoxliatl',
        'Araxxor',
        'Artio',
        'Barrows Chests',
        'Bryophyta',
        'Callisto',
        'Cal\'varion',
        'Cerberus',
        'Chambers of Xeric',
        'Chambers of Xeric: Challenge Mode',
        'Chaos Elemental',
        'Chaos Fanatic',
        'Commander Zilyana',
        'Corporeal Beast',
        'Crazy Archaeologist',
        'Dagannoth Prime',
        'Dagannoth Rex',
        'Dagannoth Supreme',
        'Deranged Archaeologist',
        'Doom of Mokhaiotl',
        'Duke Sucellus',
        'General Graardor',
        'Giant Mole',
        'Grotesque Guardians',
        'Hespori',
        'Kalphite Queen',
        'King Black Dragon',
        'Kraken',
        'Kree\'Arra',
        'K\'ril Tsutsaroth',
        'Lunar Chests',
        'Mimic',
        'Nex',
        'Nightmare',
        'Phosani\'s Nightmare',
        'Obor',
        'Phantom Muspah',
        'Sarachnis',
        'Scorpia',
        'Scurrius',
        'Shellbane Gryphon',
        'Skotizo',
        'Sol Heredit',
        'Spindel',
        'Tempoross',
        'The Gauntlet',
        'The Corrupted Gauntlet',
        'The Hueycoatl',
        'The Leviathan',
        'The Royal Titans',
        'The Whisperer',
        'Theatre of Blood',
        'Theatre of Blood: Hard Mode',
        'Thermonuclear Smoke Devil',
        'Tombs of Amascut',
        'Tombs of Amascut: Expert Mode',
        'TzKal-Zuk',
        'TzTok-Jad',
        'Vardorvis',
        'Venenatis',
        'Vet\'ion',
        'Vorkath',
        'Wintertodt',
        'Yama',
        'Zalcano',
        'Zulrah',
    ];

    /**
     * Fetch player hiscores data from RuneScape API
     *
     * @param string $playerName
     * @return array|null
     */
    public function fetchPlayerData(string $playerName): ?array
    {
        try {
            $response = Http::timeout(10)->get(
                self::BASE_URL . '/index_lite.ws',
                ['player' => $playerName]
            );

            if (!$response->successful()) {
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
     *
     * @param string $data
     * @return array
     */
    private function parseHiscoresData(string $data): array
    {
        $lines = explode("\n", trim($data));
        $parsed = [
            'skills' => [],
            'activities' => [],
        ];

        $skillCount = count(self::SKILLS);
        $activityCount = count(self::ACTIVITIES);

        // Parse skills
        for ($i = 0; $i < $skillCount && $i < count($lines); $i++) {
            $values = explode(',', trim($lines[$i]));
            $parsed['skills'][self::SKILLS[$i]] = [
                'rank' => (int) ($values[0] ?? -1),
                'level' => (int) ($values[1] ?? 0),
                'experience' => (int) ($values[2] ?? 0),
            ];
        }

        // Parse activities (start after skills)
        $activityStartIndex = $skillCount;
        for ($i = 0; $i < $activityCount && ($activityStartIndex + $i) < count($lines); $i++) {
            $values = explode(',', trim($lines[$activityStartIndex + $i]));
            $parsed['activities'][self::ACTIVITIES[$i]] = [
                'rank' => (int) ($values[0] ?? -1),
                'score' => (int) ($values[1] ?? 0),
            ];
        }

        return $parsed;
    }
}

