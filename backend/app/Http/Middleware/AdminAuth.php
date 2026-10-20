<?php

namespace App\Http\Middleware;

use App\Support\Api;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Pagar endpoint admin (setara requireAdmin() sebelumnya). */
class AdminAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $admin = $request->session()->get('admin');
        if (!$admin) {
            return Api::fail('Sesi admin tidak ditemukan atau sudah berakhir. Silakan login kembali.', 401);
        }
        $request->attributes->set('admin', $admin);
        return $next($request);
    }
}
