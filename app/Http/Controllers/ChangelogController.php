<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\File;

class ChangelogController extends Controller
{
    /**
     * Get the changelog content
     */
    public function index(): JsonResponse
    {
        $changelogPath = base_path('CHANGELOG.md');
        
        if (!File::exists($changelogPath)) {
            return response()->json([
                'content' => '# Changelog\n\nNo changelog available.',
            ]);
        }
        
        $content = File::get($changelogPath);
        
        return response()->json([
            'content' => $content,
        ]);
    }
}

