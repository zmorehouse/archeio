<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

// Increase memory limit for Laravel Cloud (handles large JSON payloads)
// This is set early in the bootstrap process before any heavy operations
if (! ini_get('memory_limit') || ini_get('memory_limit') === '-1' || (int) ini_get('memory_limit') < 512) {
    ini_set('memory_limit', '512M');
}

// Increase execution time for large data processing
ini_set('max_execution_time', '60');

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Enhance memory error reporting with detailed context for Nightwatch
        // Use report() to log detailed context before rendering
        $exceptions->report(function (Throwable $e) {
            if ($e instanceof \Symfony\Component\ErrorHandler\Error\FatalError) {
                if (str_contains($e->getMessage(), 'memory') || str_contains($e->getMessage(), 'Memory')) {
                    $formatBytes = function (int $bytes, int $precision = 2): string {
                        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
                        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
                            $bytes /= 1024;
                        }

                        return round($bytes, $precision).' '.$units[$i];
                    };

                    $request = request();
                    $context = [
                        'error_type' => 'memory_exhaustion',
                        'url' => $request?->fullUrl() ?? 'unknown',
                        'method' => $request?->method() ?? 'unknown',
                        'route' => $request?->route()?->getName() ?? 'unknown',
                        'controller' => $request?->route()?->getActionName() ?? 'unknown',
                        'memory_limit' => ini_get('memory_limit'),
                        'memory_usage_at_error' => $formatBytes(memory_get_usage(true)),
                        'memory_peak' => $formatBytes(memory_get_peak_usage(true)),
                        'memory_peak_real' => $formatBytes(memory_get_peak_usage()),
                        'user_id' => $request?->user()?->id,
                        'ip' => $request?->ip() ?? 'unknown',
                        'user_agent' => substr($request?->userAgent() ?? '', 0, 200),
                        'request_size' => $request ? $formatBytes(strlen(serialize($request->all()))) : 'unknown',
                        'is_inertia' => $request?->header('X-Inertia') !== null,
                        'inertia_version' => $request?->header('X-Inertia-Version'),
                        'inertia_partial' => $request?->header('X-Inertia-Partial-Data'),
                        'query_string' => $request?->getQueryString(),
                        'timestamp' => now()->toIso8601String(),
                    ];

                    // Log with full context - this will appear in Nightwatch with all details
                    logger()->error('Memory exhaustion detected', $context);
                }
            }
        });

        // Enhance the exception message for display in Nightwatch
        $exceptions->render(function (Throwable $e, $request) {
            if ($e instanceof \Symfony\Component\ErrorHandler\Error\FatalError) {
                if (str_contains($e->getMessage(), 'memory') || str_contains($e->getMessage(), 'Memory')) {
                    $formatBytes = function (int $bytes, int $precision = 2): string {
                        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
                        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
                            $bytes /= 1024;
                        }

                        return round($bytes, $precision).' '.$units[$i];
                    };

                    $context = [
                        'error_type' => 'memory_exhaustion',
                        'url' => $request->fullUrl(),
                        'method' => $request->method(),
                        'route' => $request->route()?->getName() ?? 'unknown',
                        'controller' => $request->route()?->getActionName() ?? 'unknown',
                        'memory_limit' => ini_get('memory_limit'),
                        'memory_usage_at_error' => $formatBytes(memory_get_usage(true)),
                        'memory_peak' => $formatBytes(memory_get_peak_usage(true)),
                        'memory_peak_real' => $formatBytes(memory_get_peak_usage()),
                        'user_id' => $request->user()?->id,
                        'ip' => $request->ip(),
                        'user_agent' => substr($request->userAgent() ?? '', 0, 200),
                        'request_size' => $formatBytes(strlen(serialize($request->all()))),
                        'is_inertia' => $request->header('X-Inertia') !== null,
                        'inertia_version' => $request->header('X-Inertia-Version'),
                        'inertia_partial' => $request->header('X-Inertia-Partial-Data'),
                        'query_string' => $request->getQueryString(),
                        'timestamp' => now()->toIso8601String(),
                    ];

                    // Log with full context for Nightwatch
                    logger()->error('Memory exhaustion detected', $context);

                    // Create enhanced exception message that will appear in Nightwatch
                    $enhancedMessage = sprintf(
                        'Memory exhaustion on %s %s | Route: %s | Limit: %s | Peak: %s | Usage: %s | User: %s',
                        $request->method(),
                        $request->path(),
                        $request->route()?->getName() ?? 'unknown',
                        ini_get('memory_limit'),
                        $formatBytes(memory_get_peak_usage(true)),
                        $formatBytes(memory_get_usage(true)),
                        $request->user()?->id ?? 'guest'
                    );

                    // Throw new exception with enhanced message for Nightwatch
                    throw new \RuntimeException($enhancedMessage, 0, $e);
                }
            }
        });
    })->create();
