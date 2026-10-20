<?php

namespace App\Http\Controllers;

use App\Support\Api;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class AuthController extends Controller
{
    // Hash palsu: supaya waktu respons "username salah" mirip "password salah"
    private const DUMMY_HASH = '$2y$10$h4kCULa/7xs7qFSwlPmfNeWF5plVsonRJ0kzQiqXjKeYkuXDjW4I6';

    public function login(Request $request)
    {
        try {
            $username = trim((string) $request->input('username', ''));
            $password = (string) $request->input('password', '');
            if ($username === '' || $password === '') {
                return Api::fail('Username dan password wajib diisi.', 400);
            }

            $user = DB::table('admin_users')
                ->where('username', $username)
                ->where('is_active', 1)
                ->first(['admin_id', 'username', 'password_hash', 'nama']);

            // password_verify (bukan Hash::check) supaya hash lama berawalan $2a$ dari bcryptjs tetap valid.
            $cocok = password_verify($password, $user ? $user->password_hash : self::DUMMY_HASH);
            if (!$user || !$cocok) {
                return Api::fail('Username atau password salah.', 401);
            }

            $request->session()->regenerate();
            $request->session()->put('admin', [
                'id' => $user->admin_id,
                'username' => $user->username,
                'nama' => $user->nama ?: $user->username,
            ]);

            DB::table('admin_users')->where('admin_id', $user->admin_id)
                ->update(['last_login_at' => Api::nowWib()]);

            return Api::ok('Login berhasil.', [
                'username' => $user->username,
                'nama' => $user->nama ?: $user->username,
            ]);
        } catch (Throwable $e) {
            return Api::logFail('proses autentikasi', $e);
        }
    }

    public function logout(Request $request)
    {
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return Api::ok('Logout berhasil.');
    }

    public function check(Request $request)
    {
        $admin = $request->session()->get('admin');
        if (!$admin) {
            return Api::fail('Belum login.', 401);
        }
        return Api::ok('Sesi aktif.', ['username' => $admin['username'], 'nama' => $admin['nama']]);
    }

    public function changePassword(Request $request)
    {
        try {
            $admin = $request->attributes->get('admin');
            $lama = (string) $request->input('password_lama', '');
            $baru = (string) $request->input('password_baru', '');

            if ($lama === '' || $baru === '') {
                return Api::fail('Password lama dan password baru wajib diisi.', 400);
            }
            if (mb_strlen($baru) < 8) {
                return Api::fail('Password baru minimal 8 karakter.', 400);
            }

            $row = DB::table('admin_users')->where('admin_id', $admin['id'])->first(['password_hash']);
            if (!$row || !password_verify($lama, $row->password_hash)) {
                return Api::fail('Password lama tidak sesuai.', 401);
            }

            DB::table('admin_users')->where('admin_id', $admin['id'])
                ->update(['password_hash' => password_hash($baru, PASSWORD_BCRYPT)]);

            return Api::ok('Password berhasil diganti.');
        } catch (Throwable $e) {
            return Api::logFail('proses autentikasi', $e);
        }
    }
}
