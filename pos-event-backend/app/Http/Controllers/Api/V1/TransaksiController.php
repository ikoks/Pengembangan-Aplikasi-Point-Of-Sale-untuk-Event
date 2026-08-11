<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\ListTransactionRequest;
use App\Http\Resources\TransaksiResource;
use App\Models\Transaksi;
use App\Models\Kasir;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TransaksiController extends Controller
{
    public function index(ListTransactionRequest $request): AnonymousResourceCollection
    {
        /** @var Kasir $kasir */
        $kasir = $request->user();
        $filters = $request->validated();

        $query = Transaksi::query()->with($this->transactionRelations());

        $query->where(function (Builder $scope) use ($kasir): void {
            $scope->where('id_kasir', $kasir->id_kasir);

            if ($kasir->id_cabang !== null) {
                $scope->orWhere('id_cabang', $kasir->id_cabang);
            }
        });

        $query
            ->when($filters['id_shift'] ?? null, fn (Builder $q, string $value) => $q->where('id_shift', $value))
            ->when($filters['id_cabang'] ?? null, fn (Builder $q, string $value) => $q->where('id_cabang', $value))
            ->when($filters['id_metode'] ?? null, fn (Builder $q, string $value) => $q->where('id_metode', $value))
            ->when($filters['status'] ?? null, fn (Builder $q, string $value) => $q->where('status', $value))
            ->when($filters['tanggal_mulai'] ?? null, fn (Builder $q, string $value) => $q->whereDate('tanggal_transaksi', '>=', $value))
            ->when($filters['tanggal_akhir'] ?? null, fn (Builder $q, string $value) => $q->whereDate('tanggal_transaksi', '<=', $value))
            ->latest('created_at');

        return TransaksiResource::collection($query->paginate($request->perPage()));
    }

    public function show(string $id_transaksi): JsonResponse
    {
        /** @var Kasir $kasir */
        $kasir = request()->user();
        $transaksi = Transaksi::with($this->transactionRelations())
            ->where('id_transaksi', $id_transaksi)
            ->firstOrFail();

        if ($transaksi->id_kasir !== $kasir->id_kasir
            && $transaksi->id_cabang !== $kasir->id_cabang) {
            abort(403, 'Anda tidak memiliki akses ke transaksi cabang lain.');
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail transaksi berhasil diambil.',
            'data'    => new TransaksiResource($transaksi),
        ]);
    }

    /** @return array<int, string> */
    private function transactionRelations(): array
    {
        return [
            'cabang',
            'salesMode',
            'metodePembayaran',
            'kasir',
            'details.menu',
            'details.promosi',
        ];
    }
}
