<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Format respons JSON yang sama seperti versi lama: { status, message, data? }
 */
class Api
{
    public static function ok(string $message = '', mixed $data = null, int $code = 200): JsonResponse
    {
        $body = ['status' => 'success', 'message' => $message];
        if ($data !== null) {
            $body['data'] = $data;
        }
        return response()->json($body, $code);
    }

    public static function fail(string $message = '', int $code = 400): JsonResponse
    {
        return response()->json(['status' => 'error', 'message' => $message], $code);
    }

    /** Detail error hanya ke log server; pengguna mendapat pesan umum. */
    public static function logFail(string $context, Throwable $e, ?string $userMessage = null, int $code = 500): JsonResponse
    {
        Log::error('[SKM] Gagal saat ' . $context . ': ' . $e->getMessage());
        return self::fail(
            $userMessage ?? 'Terjadi kesalahan pada server saat ' . $context . '. Silakan coba lagi atau hubungi administrator.',
            $code
        );
    }

    /**
     * Bersihkan teks masukan: trim + buang tag HTML.
     * Tidak di-encode ke entitas HTML karena React sudah meng-escape saat menampilkan.
     */
    public static function clean(mixed $value): string
    {
        return trim(strip_tags((string) ($value ?? '')));
    }

    public static function empty(mixed $v): bool
    {
        return $v === null || $v === '';
    }

    public static function nowWib(): string
    {
        return now('Asia/Jakarta')->format('Y-m-d H:i:s');
    }
}
