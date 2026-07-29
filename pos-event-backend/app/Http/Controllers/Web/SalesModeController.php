<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\SalesMode;
use App\Http\Requests\Web\StoreSalesModeRequest;
use App\Http\Requests\Web\UpdateSalesModeRequest;
use Illuminate\Http\Request;

class SalesModeController extends Controller
{
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
        SalesMode::create($request->validated());
        return redirect()->route('admin.sales-mode.index')->with('success', 'Sales Mode berhasil ditambahkan.');
    }

    public function edit(SalesMode $salesMode)
    {
        return view('admin.sales-mode.edit', compact('salesMode'));
    }

    public function update(UpdateSalesModeRequest $request, SalesMode $salesMode)
    {
        $salesMode->update($request->validated());
        return redirect()->route('admin.sales-mode.index')->with('success', 'Sales Mode berhasil diperbarui.');
    }

    public function destroy(SalesMode $salesMode)
    {
        $salesMode->delete();
        return redirect()->route('admin.sales-mode.index')->with('success', 'Sales Mode berhasil dihapus.');
    }
}
