<?php

use App\Http\Controllers\Api\PlayerController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/players', [PlayerController::class, 'index']);
    Route::get('/players/{player}', [PlayerController::class, 'show']);
    Route::get('/players/{player}/stats', [PlayerController::class, 'stats']);
    Route::post('/players/refresh', [PlayerController::class, 'refresh']);
});

