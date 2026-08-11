<?php

namespace App\Exports;

use App\Models\AuditLog;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class AuditLogExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize
{
    use Exportable;

    protected $params;

    public function __construct(array $params = [])
    {
        $this->params = $params;
    }

    public function query()
    {
        $query = AuditLog::with('admin');

        if (!empty($this->params['aktivitas'])) {
            $query->where('aktivitas', 'like', '%' . $this->params['aktivitas'] . '%');
        }

        if (!empty($this->params['actor'])) {
            $actor = $this->params['actor'];
            $query->whereHas('admin', function ($q) use ($actor) {
                $q->where('nama_admin', 'like', "%{$actor}%")
                  ->orWhere('username', 'like', "%{$actor}%");
            });
        }

        if (!empty($this->params['ip_address'])) {
            $query->where('ip_address', 'like', '%' . $this->params['ip_address'] . '%');
        }

        if (!empty($this->params['tanggal_mulai'])) {
            $query->whereDate('waktu_kejadian', '>=', $this->params['tanggal_mulai']);
        }

        if (!empty($this->params['tanggal_akhir'])) {
            $query->whereDate('waktu_kejadian', '<=', $this->params['tanggal_akhir']);
        }

        return $query->latest('waktu_kejadian');
    }

    public function headings(): array
    {
        return [
            'ID Audit',
            'Waktu Kejadian',
            'Aktivitas',
            'ID Actor',
            'Nama Actor',
            'Username Actor',
            'Tabel Target',
            'ID Target',
            'IP Address',
            'User Agent',
            'Data Sebelum',
            'Data Sesudah',
        ];
    }

    public function map($log): array
    {
        return [
            $log->id_audit,
            $log->waktu_kejadian ? $log->waktu_kejadian->format('Y-m-d H:i:s') : '-',
            $log->aktivitas,
            $log->id_user_aktor ?? '-',
            $log->admin ? $log->admin->nama_admin : 'SISTEM',
            $log->admin ? $log->admin->username : '-',
            $log->tabel_target ?? '-',
            $log->id_target ?? '-',
            $log->ip_address ?? '-',
            $log->user_agent ?? '-',
            $log->data_sebelum ? json_encode($log->data_sebelum) : '-',
            $log->data_sesudah ? json_encode($log->data_sesudah) : '-',
        ];
    }
}
