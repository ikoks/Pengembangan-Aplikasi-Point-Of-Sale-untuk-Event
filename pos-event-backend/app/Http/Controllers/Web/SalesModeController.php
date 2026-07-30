<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\SalesMode;
use App\Http\Requests\Web\StoreSalesModeRequest;
use App\Http\Requests\Web\UpdateSalesModeRequest;
use Illuminate\Http\Request;
use App\Services\AuditLogService;

class SalesModeController extends Controller
{
    public function __construct(protected AuditLogService $auditLog) {}

    public function index(Request $request)
    {
        $search = $request->input('search');
        $salesModes = SalesMode::when($search, function ($query, $search) {
                return $query->where('nama_mode', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return view('admin.sales-mode.index', compact('salesModes', 'search'));
    }

    public function create()
    {
        return view('admin.sales-mode.create');
    }

    public function store(StoreSalesModeRequest $request)
    {
        $salesMode = SalesMode::create($request->validated());
        
        $this->auditLog->log(
            aktivitas: 'CREATE_SALES_MODE',
            tabelTarget: 'sales_mode',
            idTarget: $salesMode->id_sales,
            dataSesudah: $salesMode->toArray(),
            request: $request
        );
        
        return redirect()->route('admin.sales-mode.index')->with('success', 'Sales Mode berhasil ditambahkan.');
    }

    public function edit(SalesMode $salesMode)
    {
        return view('admin.sales-mode.edit', compact('salesMode'));
    }

    public function update(UpdateSalesModeRequest $request, SalesMode $salesMode)
    {
        $dataSebelum = $salesMode->toArray();
        $salesMode->update($request->validated());
        
        $this->auditLog->log(
            aktivitas: 'UPDATE_SALES_MODE',
            tabelTarget: 'sales_mode',
            idTarget: $salesMode->id_sales,
            dataSebelum: $dataSebelum,
            dataSesudah: $salesMode->fresh()->toArray(),
            request: $request
        );
        
        return redirect()->route('admin.sales-mode.index')->with('success', 'Sales Mode berhasil diperbarui.');
    }

    public function destroy(SalesMode $salesMode)
    {
        $dataSebelum = $salesMode->toArray();
        $salesMode->delete();
        
        $this->auditLog->log(
            aktivitas: 'DELETE_SALES_MODE',
            tabelTarget: 'sales_mode',
            idTarget: $salesMode->id_sales,
            dataSebelum: $dataSebelum
        );
        
        return redirect()->route('admin.sales-mode.index')->with('success', 'Sales Mode berhasil dihapus.');
    }

    public function toggleStatus(SalesMode $salesMode)
    {
        $dataSebelum = $salesMode->toArray();
        $salesMode->status = $salesMode->status === 'Aktif' ? 'Nonaktif' : 'Aktif';
        $salesMode->save();

        $this->auditLog->log(
            aktivitas: 'UPDATE_SALES_MODE_STATUS',
            tabelTarget: 'sales_mode',
            idTarget: $salesMode->id_sales,
            dataSebelum: $dataSebelum,
            dataSesudah: $salesMode->toArray(),
            request: request()
        );

        return redirect()->back()->with('success', 'Status mode penjualan berhasil diubah.');
    }
}
