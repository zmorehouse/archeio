<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PlayerController;
use Illuminate\Support\Facades\Route;

Route::get('/', [DashboardController::class, 'index'])->name('home');
Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
Route::get('players/{player}', [PlayerController::class, 'show'])->name('players.show');

require __DIR__.'/settings.php';
