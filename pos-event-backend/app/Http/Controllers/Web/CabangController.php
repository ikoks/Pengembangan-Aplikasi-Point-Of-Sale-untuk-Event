<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Cabang;
use App\Models\SalesMode;
use App\Http\Requests\Web\StoreCabangRequest;
use App\Http\Requests\Web\UpdateCabangRequest;
use Illuminate\Http\Request;
use App\Services\AuditLogService;

class CabangController extends Controller
{
    public function __construct(protected AuditLogService $auditLog) {}

    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status', 'Aktif');
        
        $cabangs = Cabang::with('salesMode')
            ->when($search, function ($query, $search) {
                return $query->where(function($q) use ($search) {
                    $q->where('nama_cabang', 'like', "%{$search}%")
                      ->orWhere('lokasi', 'like', "%{$search}%");
                });
            })
            ->when($status !== 'Semua', function ($query) use ($status) {
                return $query->where('status', $status);
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $salesModes = SalesMode::where('status', 'Aktif')->orderBy('nama_mode')->get();

        return view('admin.cabang.index', compact('cabangs', 'search', 'status', 'salesModes'));
    }

    public function create()
    {
        return view('admin.cabang.create');
    }

    public function store(StoreCabangRequest $request)
    {
        $cabang = Cabang::create($request->validated());
        
        // Auto-generate QR static token and payload
        $token = strtoupper(\Illuminate\Support\Str::random(6));
        $cabang->qr_static_token = $token;
        $cabang->qr_static_payload = json_encode([
            'id_cabang'       => $cabang->id_cabang,
            'nama_cabang'     => $cabang->nama_cabang,
            'id_sales'        => $cabang->id_sales,
            'url_backend'     => config('app.url'),
            'qr_static_token' => $token
        ]);
        $cabang->save();

        $this->auditLog->log(
            aktivitas: 'CREATE_CABANG',
            tabelTarget: 'cabang',
            idTarget: $cabang->id_cabang,
            dataSesudah: $cabang->toArray(),
            request: $request
        );
        
        return redirect()->route('admin.cabang.index')->with('success', 'Cabang berhasil ditambahkan.');
    }

    public function edit(Cabang $cabang)
    {
        return view('admin.cabang.edit', compact('cabang'));
    }

    public function update(UpdateCabangRequest $request, Cabang $cabang)
    {
        $dataSebelum = $cabang->toArray();
        $cabang->update($request->validated());
        
        // Auto-update QR static payload to reflect any changes
        if (!$cabang->qr_static_token) {
            $cabang->qr_static_token = strtoupper(\Illuminate\Support\Str::random(6));
        }
        $cabang->qr_static_payload = json_encode([
            'id_cabang'       => $cabang->id_cabang,
            'nama_cabang'     => $cabang->nama_cabang,
            'id_sales'        => $cabang->id_sales,
            'url_backend'     => config('app.url'),
            'qr_static_token' => $cabang->qr_static_token
        ]);
        $cabang->save();
        
        $this->auditLog->log(
            aktivitas: 'UPDATE_CABANG',
            tabelTarget: 'cabang',
            idTarget: $cabang->id_cabang,
            dataSebelum: $dataSebelum,
            dataSesudah: $cabang->fresh()->toArray(),
            request: $request
        );
        
        return redirect()->route('admin.cabang.index')->with('success', 'Cabang berhasil diperbarui.');
    }

    public function destroy(Cabang $cabang)
    {
        $dataSebelum = $cabang->toArray();
        $cabang->delete();
        
        $this->auditLog->log(
            aktivitas: 'DELETE_CABANG',
            tabelTarget: 'cabang',
            idTarget: $cabang->id_cabang,
            dataSebelum: $dataSebelum
        );
        
        return redirect()->route('admin.cabang.index')->with('success', 'Cabang berhasil dihapus.');
    }

    public function toggleStatus(Cabang $cabang)
    {
        $dataSebelum = $cabang->toArray();
        $cabang->status = $cabang->status === 'Aktif' ? 'Nonaktif' : 'Aktif';
        $cabang->save();

        $this->auditLog->log(
            aktivitas: 'UPDATE_CABANG_STATUS',
            tabelTarget: 'cabang',
            idTarget: $cabang->id_cabang,
            dataSebelum: $dataSebelum,
            dataSesudah: $cabang->toArray(),
            request: request()
        );

        return redirect()->back()->with('success', 'Status cabang berhasil diubah.');
    }

    public function downloadQr(Cabang $cabang)
    {
        if (empty($cabang->qr_static_payload)) {
            return redirect()->back()->with('error', 'Payload QR Statis belum diatur untuk cabang ini.');
        }

        // Generate QR Code as PNG menggunakan library Endroid QrCode (Mendukung ekstensi GD)
        $qrCode = new \Endroid\QrCode\QrCode(
            data: $cabang->qr_static_payload,
            encoding: new \Endroid\QrCode\Encoding\Encoding('UTF-8'),
            size: 400,
            margin: 10
        );

        $writer = new \Endroid\QrCode\Writer\PngWriter();
        $result = $writer->write($qrCode);

        $filename = 'QR-Cabang-' . \Illuminate\Support\Str::slug($cabang->nama_cabang) . '.png';

        return response($result->getString())
                ->header('Content-type', $result->getMimeType())
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }
}
