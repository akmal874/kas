// ============================================================
//  EKSPOR EXCEL (SheetJS) + CETAK
// ============================================================
function exportExcel(rows, ringkasan, info) {
  const header = ["No","Tanggal","Uraian","Pajak","Pemasukan","Pengeluaran","Saldo","Toko / Penerima","Penanggung Jawab","Keterangan"];
  const body = rows.map((r, i) => [
    i + 1, r.tanggal, r.uraian, r.pajak,
    r.jenis === "masuk" ? r.nominal : "",
    r.jenis === "keluar" ? r.nominal : "",
    r.saldoBerjalan, r.nama_toko || "", r.penanggung_jawab, r.keterangan || ""
  ]);

  const meta = [
    ["LAPORAN DANA BANTUAN REVITALISASI SMK 2026"],
    [info.nama_sekolah || ""],
    [],
    ["Pagu Anggaran", ringkasan ? info.pagu : ""],
    ["Total Pemasukan", ringkasan?.masuk],
    ["Total Pengeluaran", ringkasan?.keluar],
    ["Saldo Akhir", ringkasan?.saldoAkhir],
    []
  ];

  const aoa = [...meta, header, ...body];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [{wch:4},{wch:12},{wch:32},{wch:12},{wch:14},{wch:14},{wch:14},{wch:20},{wch:22},{wch:24}];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Laporan");
  XLSX.writeFile(wb, `Laporan-Revitalisasi-SMK-2026.xlsx`);
}

function cetak() {
  if (window.renderAllForPrint) window.renderAllForPrint();
  const restore = () => { if (window.loadTransaksiRestore) window.loadTransaksiRestore(); window.removeEventListener("afterprint", restore); };
  window.addEventListener("afterprint", restore);
  window.print();
}

window.exportExcel = exportExcel;
window.cetak = cetak;
