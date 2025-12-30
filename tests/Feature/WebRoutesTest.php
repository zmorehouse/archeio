<?php

use App\Models\Player;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('home route returns successful response', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
});

test('dashboard route returns successful response', function () {
    $response = $this->get('/dashboard');

    $response->assertStatus(200);
});

test('player route returns successful response for existing player', function () {
    $player = Player::factory()->create(['name' => 'TestPlayer']);

    $response = $this->get("/players/{$player->name}");

    $response->assertStatus(200);
});

test('player route returns 404 for non-existent player', function () {
    $response = $this->get('/players/NonExistentPlayer');

    $response->assertStatus(404);
});

