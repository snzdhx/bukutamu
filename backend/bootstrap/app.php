<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
        // Rute API dipasang dengan grup "web" (bukan "api") supaya memakai
        // session + cookie, sama seperti login admin versi sebelumnya.
        then: function () {
            Route::middleware('web')
                ->prefix('api')
                ->group(base_path('routes/api.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Frontend React memanggil API lewat fetch JSON/FormData tanpa token CSRF.
        // Cookie sesi sudah HttpOnly + SameSite=Lax, jadi POST lintas-situs tidak membawa cookie.
        $middleware->validateCsrfTokens(except: ['api/*']);
        $middleware->alias(['admin' => \App\Http\Middleware\AdminAuth::class]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->shouldRenderJsonWhen(
            fn ($request, $e) => $request->is('api/*') || $request->expectsJson()
        );
    })
    ->create();
