<?php

use App\Http\Controllers\AdminDataController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ExportRespondenController;
use App\Http\Controllers\GalleryController;
use App\Http\Controllers\SurveiController;
use Illuminate\Support\Facades\Route;

/* ---------- Publik ---------- */
Route::get('/survei/refs', [SurveiController::class, 'refs']);
Route::post('/survei', [SurveiController::class, 'store'])->middleware('throttle:30,1');
Route::get('/gallery', [GalleryController::class, 'publicList']);

/* ---------- Autentikasi admin ---------- */
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/auth/logout', [AuthController::class, 'logout']);
Route::get('/auth/check', [AuthController::class, 'check']);

/* ---------- Khusus admin ---------- */
Route::middleware('admin')->group(function () {
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    Route::prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminDataController::class, 'dashboard']);
        Route::get('/demografi-chart', [AdminDataController::class, 'demografiChart']);

        Route::get('/responden', [AdminDataController::class, 'responden']);
        Route::get('/responden/export', ExportRespondenController::class);
        Route::get('/responden/{id}', [AdminDataController::class, 'respondenDetail'])->whereNumber('id');
        Route::delete('/responden/{id}', [AdminDataController::class, 'respondenDelete'])->whereNumber('id');

        Route::get('/gallery', [GalleryController::class, 'adminList']);
        Route::post('/gallery', [GalleryController::class, 'store']);
        Route::get('/gallery/{id}', [GalleryController::class, 'show']);
        Route::post('/gallery/{id}', [GalleryController::class, 'update']); // POST (multipart), bukan PUT
        Route::delete('/gallery/{id}', [GalleryController::class, 'destroy']);
    });
});
