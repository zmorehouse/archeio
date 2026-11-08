<?php

use App\Models\Player;
use App\Models\PlayerStat;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

test('migrations add CrabDentist as a tracked player', function () {
    expect(Player::where('name', 'CrabDentist')->count())->toBe(1);
});

test('player seeder is idempotent for CrabDentist', function () {
    $this->seed(\Database\Seeders\PlayerSeeder::class);
    $this->seed(\Database\Seeders\PlayerSeeder::class);

    expect(Player::where('name', 'CrabDentist')->count())->toBe(1);
});

test('fetch-stats retrieves hiscores for CrabDentist', function () {
    $skills = collect(range(1, 25))->map(fn ($i) => "{$i},{$i},".($i * 1000))->implode("\n");

    Http::fake([
        '*hiscore_oldschool*' => Http::response($skills, 200),
    ]);

    $this->artisan('players:fetch-stats')->assertSuccessful();

    Http::assertSent(fn ($request) => $request['player'] === 'CrabDentist');

    $player = Player::where('name', 'CrabDentist')->first();
    expect(PlayerStat::where('player_id', $player->id)->count())->toBe(1);
});
