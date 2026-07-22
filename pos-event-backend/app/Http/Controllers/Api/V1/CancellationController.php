<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\CancelTransactionRequest;
use App\Http\Requests\Api\V1\VoidItemRequest;
use App\Http\Resources\TransaksiResource;
use App\Models\Transaksi;
use App\Models\TransaksiDetail;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class CancellationController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService)
    {
    }

    public function cancel(
        CancelTransactionRequest $request,
        string $id_transaksi
    ): JsonResponse {
        $transaksi = DB::transaction(function () use ($request, $id_transaksi): Transaksi {
            $transaksi = Transaksi::where('id_transaksi', $id_transaksi)
                ->lockForUpdate()
                ->first();

            abort_if($transaksi === null, 404, 'Transaksi tidak ditemukan.');

            if (in_array($transaksi->status, ['Cancelled', 'Void'], true)) {
                abort(422, 'Transaksi sudah dibatalkan sebelumnya.');
            }

            $dataSebelum = $transaksi->toArray();
            $transaksi->update([
                'status'          => 'Cancelled',
                'alasan_batal'    => $request->validated('alasan_batal'),
                'diperbarui_oleh' => $request->user()->id_user,
                'catatan_koreksi' => 'Dibatalkan oleh operator kasir/admin pada ' . now(),
            ]);

            $this->auditLogService->log(
                'CANCEL_TRANSACTION',
                'transaksi',
                $transaksi->id_transaksi,
                $dataSebelum,
                $transaksi->toArray()
            );

            return $transaksi;
        });

        $this->loadTransactionRelations($transaksi);

        return response()->json([
            'success' => true,
            'message' => 'Transaksi berhasil dibatalkan.',
            'data'    => new TransaksiResource($transaksi),
        ]);
    }

    public function voidItem(
        VoidItemRequest $request,
        string $id_transaksi
    ): JsonResponse {
        $transaksi = DB::transaction(function () use ($request, $id_transaksi): Transaksi {
            $transaksi = Transaksi::where('id_transaksi', $id_transaksi)
                ->lockForUpdate()
                ->first();

            abort_if($transaksi === null, 404, 'Transaksi tidak ditemukan.');

            /** @var TransaksiDetail|null $itemDetail */
            $itemDetail = TransaksiDetail::where('id_transaksi', $transaksi->id_transaksi)
                ->where('id_transaksi_detail', $request->validated('id_transaksi_detail'))
                ->lockForUpdate()
                ->first();

            abort_if($itemDetail === null, 404, 'Item detail tidak ditemukan pada transaksi tersebut.');

            if ($itemDetail->status_item === 'Void') {
                abort(422, 'Item menu ini sudah di-void sebelumnya.');
            }

            $dataSebelum = $itemDetail->toArray();
            $itemDetail->update([
                'status_item'       => 'Void',
                'alasan_batal_item' => $request->validated('alasan_batal_item'),
            ]);

            $detailsAktif = TransaksiDetail::where('id_transaksi', $transaksi->id_transaksi)
                ->where('status_item', 'Active')
                ->lockForUpdate()
                ->get();

            if ($detailsAktif->isEmpty()) {
                $transaksi->update([
                    'status'       => 'Void',
                    'alasan_batal' => 'Seluruh item di-void',
                    'tax'          => 0,
                    'total'        => 0,
                ]);
            } else {
                $totalBelanjaAktif = round((float) $detailsAktif->sum('subtotal_item'), 2);
                $pajakPersen = (float) $transaksi->cabang()->value('pajak_persen');
                $tax = round($totalBelanjaAktif * ($pajakPersen / 100), 2);

                $transaksi->update([
                    'tax'   => $tax,
                    'total' => round($totalBelanjaAktif + $tax, 2),
                ]);
            }

            $this->auditLogService->log(
                'VOID_ITEM',
                'transaksi_detail',
                $itemDetail->id_transaksi_detail,
                $dataSebelum,
                $itemDetail->toArray()
            );

            return $transaksi->fresh();
        });

        $this->loadTransactionRelations($transaksi);

        return response()->json([
            'success' => true,
            'message' => 'Item transaksi berhasil di-void.',
            'data'    => new TransaksiResource($transaksi),
        ]);
    }

    private function loadTransactionRelations(Transaksi $transaksi): void
    {
        $transaksi->load([
            'kasir',
            'cabang',
            'salesMode',
            'metodePembayaran',
            'promosi',
            'details.menu',
            'details.promosi',
        ]);
    }
}
