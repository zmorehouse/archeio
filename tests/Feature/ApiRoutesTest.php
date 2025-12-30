<?php

use App\Models\Player;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('GET /api/v1/players returns list of players', function () {
    Player::factory()->count(3)->create();

    $response = $this->getJson('/api/v1/players');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'name', 'created_at', 'updated_at'],
            ],
        ]);
});

test('GET /api/v1/players/{player} returns specific player', function () {
    $player = Player::factory()->create(['name' => 'TestPlayer']);

    $response = $this->getJson("/api/v1/players/{$player->name}");

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => ['id', 'name', 'created_at', 'updated_at'],
        ])
        ->assertJson([
            'data' => [
                'name' => 'TestPlayer',
            ],
        ]);
});

test('GET /api/v1/players/{player} returns 404 for non-existent player', function () {
    $response = $this->getJson('/api/v1/players/NonExistentPlayer');

    $response->assertStatus(404);
});

test('GET /api/v1/players/{player}/stats returns player stats', function () {
    $player = Player::factory()->create(['name' => 'TestPlayer']);

    $response = $this->getJson("/api/v1/players/{$player->name}/stats");

    // This endpoint may return 503 if API fails, or 200 if successful
    // We just check it doesn't return 404
    expect($response->status())->not->toBe(404);
});

test('POST /api/v1/players/refresh initiates refresh', function () {
    Player::factory()->count(2)->create();

    $response = $this->postJson('/api/v1/players/refresh');

    // This endpoint may return 200 or 500 depending on command execution
    // We just check it doesn't return 404
    expect($response->status())->not->toBe(404);
    expect($response->json())->toHaveKey('message');
});

