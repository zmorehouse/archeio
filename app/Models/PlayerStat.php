<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlayerStat extends Model
{
    protected $fillable = [
        'player_id',
        'skills',
        'activities',
        'data_hash',
        'fetched_at',
    ];

    protected $casts = [
        'skills' => 'array',
        'activities' => 'array',
        'fetched_at' => 'datetime',
    ];

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }
}
