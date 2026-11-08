<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const PLAYER = 'CrabDentist';

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $now = now();

        DB::table('players')->insertOrIgnore([
            'name' => self::PLAYER,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $player = DB::table('players')->where('name', self::PLAYER)->first();

        if ($player) {
            DB::table('player_stats')->where('player_id', $player->id)->delete();
            DB::table('players')->where('id', $player->id)->delete();
        }
    }
};
