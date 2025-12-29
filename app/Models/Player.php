<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Player extends Model
{
    protected $fillable = ['name'];

    public function stats(): HasMany
    {
        return $this->hasMany(PlayerStat::class)->orderBy('fetched_at', 'desc');
    }

    public function latestStat(): ?PlayerStat
    {
        return $this->stats()->first();
    }
}
