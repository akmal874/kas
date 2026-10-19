// ============================================================
//  CETAK — membangun HTML laporan bersih (terpisah dari tabel app)
//  Menghindari konflik CSS: tabel cetak dibuat dari nol, teks polos.
// ============================================================

function _rpCetak(n){ return (n||0).toLocaleString("id-ID"); }
function _tglCetak(d){
  const dt = new Date(d + "T00:00:00");
  const bln = dt.toLocaleDateString("id-ID",{month:"short"});
  return `${String(dt.getDate()).padStart(2,"0")}-${bln}-${String(dt.getFullYear()).slice(-2)}`;
}
function _pajakCetak(v){
  const f = (window.MASTER?.pajak||[]).find(p=>p.value===v);
  return f ? f.label : "Tanpa Pajak";
}

// Bangun elemen laporan cetak & tempel ke #printRoot
function buildPrintReport(){
  const p = STATE.pengaturan;
  const rows = applyFilter(STATE.rows);   // semua baris terfilter (tanpa pagination)
  const R = hitungRingkasan(STATE.rows, p.pagu_anggaran);

  const logo = (document.querySelector('.crest img')?.src) || 'assets/logo.png';

  const kop = `
    <div class="pr-kop">
      <img src="${logo}" alt="Logo">
      <div class="pr-kop-txt">
        <div class="pr-l1">Laporan Realisasi Penggunaan Dana</div>
        <div class="pr-l2">Bantuan Revitalisasi SMK Tahun 2026</div>
        <div class="pr-l3">${p.nama_sekolah}</div>
      </div>
    </div>`;

  const ringkas = `
    <div class="pr-summary">
      <div class="pr-box"><div class="pr-box-l">Pagu Anggaran</div><div class="pr-box-v">Rp ${_rpCetak(p.pagu_anggaran)}</div></div>
      <div class="pr-box"><div class="pr-box-l">Total Pemasukan</div><div class="pr-box-v pr-in">Rp ${_rpCetak(R.masuk)}</div></div>
      <div class="pr-box"><div class="pr-box-l">Total Pengeluaran</div><div class="pr-box-v pr-out">Rp ${_rpCetak(R.keluar)}</div></div>
      <div class="pr-box"><div class="pr-box-l">Saldo Akhir</div><div class="pr-box-v">Rp ${_rpCetak(R.saldoAkhir)}</div></div>
    </div>`;

  const body = rows.map((r,i)=>`
    <tr>
      <td class="c">${i+1}</td>
      <td class="c">${_tglCetak(r.tanggal)}</td>
      <td>${r.uraian||""}</td>
      <td class="r">${r.jenis==="masuk" ? _rpCetak(r.nominal) : "-"}</td>
      <td class="r">${r.jenis==="keluar" ? _rpCetak(r.nominal) : "-"}</td>
      <td class="r">${_rpCetak(r.saldoBerjalan)}</td>
      <td>${_pajakCetak(r.pajak)}</td>
      <td>${r.nama_toko||"-"}</td>
      <td>${r.keterangan||"-"}</td>
    </tr>`).join("");

  const tabel = `
    <table class="pr-table">
      <thead>
        <tr>
          <th style="width:4%">NO</th>
          <th style="width:8%">TANGGAL</th>
          <th style="width:24%">URAIAN TRANSAKSI</th>
          <th style="width:12%">PEMASUKAN<br>(Rp)</th>
          <th style="width:12%">PENGELUARAN<br>(Rp)</th>
          <th style="width:12%">SALDO<br>(Rp)</th>
          <th style="width:8%">PAJAK</th>
          <th style="width:11%">TOKO / PENERIMA</th>
          <th style="width:9%">KETERANGAN</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>`;

  const ttd = `
    <div class="pr-sign">
      <div class="pr-sign-col">
        <div>Mengetahui,</div>
        <div>Kepala Sekolah</div>
        <div class="pr-sp"></div>
        <div class="pr-name">Drs. H. Muhammad Nur, M.M.</div>
      </div>
      <div class="pr-sign-col">
        <div>Kepulauan Selayar, ${new Date().toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}</div>
        <div>Bendahara</div>
        <div class="pr-sp"></div>
        <div class="pr-name">Akmal Iskandar, S.Pi</div>
      </div>
    </div>`;

  document.getElementById("printRoot").innerHTML = kop + ringkas + tabel + ttd;
}

function cetakLaporan(){
  buildPrintReport();
  const clean = ()=>{ document.getElementById("printRoot").innerHTML=""; window.removeEventListener("afterprint", clean); };
  window.addEventListener("afterprint", clean);
  window.print();
}

window.cetakLaporan = cetakLaporan;
