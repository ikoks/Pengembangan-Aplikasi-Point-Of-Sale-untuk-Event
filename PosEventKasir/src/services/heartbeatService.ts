import apiClient from './api/apiClient';

/**
 * HeartbeatService
 *
 * Mengirimkan ping periodik ke backend (POST /api/v1/shift/heartbeat) setiap 30 detik
 * saat aplikasi kasir aktif dan terautentikasi.
 *
 * Efek di Backend & Admin Dashboard:
 * - Memperbarui kolom `last_used_at` pada personal_access_tokens di Laravel Sanctum.
 * - Memperbarui `updated_at` pada shift_session aktif.
 * - Status kasir di Web Admin dashboard terdeteksi secara real-time sebagai ONLINE (AKTIF).
 * - Ketika aplikasi kasir ditutup, HP dimatikan, atau Wi-Fi putus, heartbeat berhenti
 *   sehingga dalam waktu 2 menit status kasir otomatis berubah menjadi OFFLINE di Admin.
 */
class HeartbeatService {
  private timer: any = null;
  private isRunning: boolean = false;
  private readonly INTERVAL_MS: number = 30000; // 30 detik
  private onForceLogoutCallback: ((message: string) => void) | null = null;

  public setOnForceLogout(cb: ((message: string) => void) | null): void {
    this.onForceLogoutCallback = cb;
  }

  public start(): void {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    console.log('💓 [HeartbeatService] Memulai heartbeat kehadiran kasir...');

    // Kirim satu kali segera setelah start
    this.sendPing();

    this.timer = setInterval(() => {
      this.sendPing();
    }, this.INTERVAL_MS);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log('⏹️ [HeartbeatService] Heartbeat kehadiran kasir dihentikan.');
  }

  public async sendPing(): Promise<void> {
    try {
      const res = await apiClient.post<{ success: boolean; message?: string }>('/api/v1/shift/heartbeat', {});
      if (res.data?.success) {
        // Ping sukses tercatat di server
      }
    } catch (err: any) {
      const is401 =
        err?.statusCode === 401 ||
        err?.response?.status === 401 ||
        err?.code === 'UNAUTHORIZED';

      if (is401) {
        console.warn('⚠️ [HeartbeatService] Token kasir dicabut / akun dinonaktifkan (401). Trigger Force Logout.');
        this.stop();
        if (this.onForceLogoutCallback) {
          const msg =
            err?.message ||
            'Akun kasir Anda telah dinonaktifkan oleh Admin. Sesi telah diakhiri.';
          this.onForceLogoutCallback(msg);
        }
      }
    }
  }
}

export const heartbeatService = new HeartbeatService();
