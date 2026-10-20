<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CreateAdmin extends Command
{
    protected $signature = 'skm:admin {username} {--nama=} {--password=}';
    protected $description = 'Buat atau reset akun admin (password di-hash bcrypt)';

    public function handle(): int
    {
        $username = trim((string) $this->argument('username'));
        $password = (string) ($this->option('password') ?: $this->secret('Password (minimal 8 karakter)'));
        if (mb_strlen($password) < 8) {
            $this->error('Password minimal 8 karakter.');
            return self::FAILURE;
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);
        $nama = $this->option('nama') ?: $username;

        $ada = DB::table('admin_users')->where('username', $username)->exists();
        if ($ada) {
            DB::table('admin_users')->where('username', $username)->update(['password_hash' => $hash, 'is_active' => 1]);
            $this->info("Password admin '$username' diperbarui.");
        } else {
            DB::table('admin_users')->insert([
                'username' => $username, 'password_hash' => $hash, 'nama' => $nama, 'is_active' => 1,
            ]);
            $this->info("Admin '$username' dibuat.");
        }
        return self::SUCCESS;
    }
}
