<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Kategori;
use Illuminate\Http\Request;

class AdminAjaxController extends Controller
{
    /**
     * Get list of Kategori for Ajax Select Modal
     */
    public function kategori(Request $request)
    {
        $search = $request->get('search');
        
        $query = Kategori::query()->where('status', 'Aktif')->orderBy('nama_kategori');
        
        if ($search) {
            $query->where('nama_kategori', 'like', "%{$search}%");
        }
        
        // Batasi jumlah yang dikembalikan untuk performa
        $kategoris = $query->limit(50)->get(['id_kategori', 'nama_kategori']);
        
        return response()->json([
            'status' => 'success',
            'data' => $kategoris
        ]);
    }

    /**
     * Get list of Sub-Kategori for Ajax Select Modal
     */
    public function subKategori(Request $request)
    {
        $search = $request->get('search');
        
        $query = \App\Models\SubKategori::with('kategori')->where('status', 'Aktif')->orderBy('nama_sub_kategori');
        
        if ($search) {
            $query->where('nama_sub_kategori', 'like', "%{$search}%")
                  ->orWhereHas('kategori', function($q) use ($search) {
                      $q->where('nama_kategori', 'like', "%{$search}%");
                  });
        }
        
        $subKategoris = $query->limit(50)->get(['id_sub_kategori', 'id_kategori', 'nama_sub_kategori']);
        
        // Map data agar menyertakan nama kategori induk untuk tampilan UI
        $mapped = $subKategoris->map(function ($item) {
            return [
                'id_sub_kategori' => $item->id_sub_kategori,
                'nama_sub_kategori' => $item->nama_sub_kategori,
                'nama_kategori' => $item->kategori->nama_kategori ?? '-',
                // string gabungan untuk UI picker
                'label_lengkap' => ($item->kategori->nama_kategori ?? '-') . ' - ' . $item->nama_sub_kategori
            ];
        });
        
        return response()->json([
            'status' => 'success',
            'data' => $mapped
        ]);
    }

    /**
     * Get list of Menu for Ajax Select Modal
     */
    public function menu(Request $request)
    {
        $search = $request->get('search');
        $query = \App\Models\Menu::with('subKategori')->where('status', 'Aktif')->orderBy('nama_menu');
        
        if ($search) {
            $query->where('nama_menu', 'like', "%{$search}%");
        }
        
        $menus = $query->limit(50)->get(['id_menu', 'id_sub_kategori', 'nama_menu']);
        
        $mapped = $menus->map(function ($item) {
            return [
                'id_menu' => $item->id_menu,
                'nama_menu' => $item->nama_menu,
                'sub_kategori' => $item->subKategori->nama_sub_kategori ?? '-',
                'label_lengkap' => $item->nama_menu . ' (' . ($item->subKategori->nama_sub_kategori ?? '-') . ')'
            ];
        });
        
        return response()->json([
            'status' => 'success',
            'data' => $mapped
        ]);
    }

    /**
     * Get list of Sales Mode for Ajax Select Modal
     */
    public function salesMode(Request $request)
    {
        $search = $request->get('search');
        $query = \App\Models\SalesMode::where('status', 'Aktif')->orderBy('nama_mode');
        
        if ($search) {
            $query->where('nama_mode', 'like', "%{$search}%");
        }
        
        $salesModes = $query->limit(50)->get(['id_sales', 'nama_mode']);
        
        $mapped = $salesModes->map(function ($item) {
            return [
                'id_sales'   => $item->id_sales,
                'nama_sales' => $item->nama_mode, // alias untuk kompatibilitas view
                'nama_mode'  => $item->nama_mode,
            ];
        });
        
        return response()->json([
            'status' => 'success',
            'data'   => $mapped
        ]);
    }

    /**
     * Get list of Cabang for Ajax Select Modal
     */
    public function cabang(Request $request)
    {
        $search = $request->get('search');
        $query = \App\Models\Cabang::where('status', 'Aktif')->orderBy('nama_cabang');
        
        if ($search) {
            $query->where('nama_cabang', 'like', "%{$search}%")
                  ->orWhere('lokasi', 'like', "%{$search}%");
        }
        
        $cabangs = $query->limit(50)->get(['id_cabang', 'nama_cabang', 'lokasi']);
        
        $mapped = $cabangs->map(function ($item) {
            return [
                'id_cabang' => $item->id_cabang,
                'nama_cabang' => $item->nama_cabang,
                'lokasi' => $item->lokasi,
                'label_lengkap' => $item->nama_cabang . ' - ' . $item->lokasi
            ];
        });
        
        return response()->json([
            'status' => 'success',
            'data' => $mapped
        ]);
    }

    /**
     * Get list of Kategori Metode Pembayaran for Ajax Select Modal
     */
    public function kategoriPembayaran(Request $request)
    {
        $search = $request->get('search');
        $query = \App\Models\KategoriMetodePembayaran::where('status', 'Aktif')->orderBy('nama_kategori');
        
        if ($search) {
            $query->where('nama_kategori', 'like', "%{$search}%");
        }
        
        $kategoris = $query->limit(50)->get(['id_kategori_metode', 'nama_kategori']);
        
        return response()->json([
            'status' => 'success',
            'data' => $kategoris
        ]);
    }
    /**
     * Get list of Menu with prices filtered by Sales Mode
     */
    public function menusBySalesMode(Request $request)
    {
        $idSales = $request->get('id_sales');

        if (!$idSales) {
            return response()->json(['status' => 'error', 'message' => 'id_sales diperlukan', 'data' => []]);
        }

        $templates = \App\Models\MenuTemplate::with(['menu', 'salesMode'])
            ->where('id_sales', $idSales)
            ->whereHas('menu', fn($q) => $q->where('status', 'Aktif'))
            ->get();

        $mapped = $templates->map(function ($tpl) {
            return [
                'id_template' => $tpl->id_template,
                'id_menu'     => $tpl->id_menu,
                'nama_menu'   => $tpl->menu->nama_menu ?? '-',
                'harga'       => (float) $tpl->harga_produk,
                'harga_fmt'   => 'Rp ' . number_format((float) $tpl->harga_produk, 0, ',', '.'),
            ];
        })->sortBy('nama_menu')->values();

        return response()->json([
            'status' => 'success',
            'data'   => $mapped,
        ]);
    }
}
