// ============================================================
//  DATA MASTER (untuk dropdown form)
//  Edit daftar di sini untuk menambah/mengubah pilihan.
// ============================================================
window.MASTER = {
  // Penanggung jawab
  penanggungJawab: [
    "Akmal Iskandar, S.Pi",
    "Edwar Agus, S.Pd",
    "Zul Fikar, S.Pd",
    "Muhadir, S.Pi",
    "Syahrul Raja, S.Pd",
  ],

  // Daftar toko (bisa ditambah lewat form dengan opsi "+ Toko lain…")
  toko: ["Toko Kawan Baru", "Toko Sinar Jaya", "Toko Cipta Jaya"],

  // Jenis pajak: value dipakai sistem, label ditampilkan
    pajak: [
    { value: "tanpa", label: "Tanpa Pajak", rate: 0 },
    { value: "ppn11", label: "PPN 11%", rate: 0.11 },
    { value: "pph21_5", label: "PPh 21 5%", rate: 0.05 },
    { value: "pph21_6", label: "PPh 21 6%", rate: 0.06 },
    { value: "pph22", label: "PPh 22", rate: null },
    { value: "pph23", label: "PPh 23", rate: null },
    { value: "pph4", label: "PPh 4", rate: null },
  ],
};

// label pajak untuk ditampilkan di tabel
window.pajakLabel = (v) => {
  const f = window.MASTER.pajak.find((p) => p.value === v);
  return f ? f.label : "Tanpa Pajak";
};

// ambil rate pajak (null = manual)
window.pajakRate = (v) => {
  const f = window.MASTER.pajak.find((p) => p.value === v);
  return f ? f.rate : 0;
};
// ============================================================
//  DAFTAR PEKERJAAN UNTUK KATEGORI UPAH
//  value = kode yang disimpan di database (jangan diubah setelah dipakai)
// ============================================================
window.MASTER.pekerjaan = [
  { value: "nkpi",   label: "Upah Rehab Kelas NKPI",        singkat: "Rehab Kelas NKPI" },
  { value: "nkn",    label: "Upah Rehab Kelas NKN",         singkat: "Rehab Kelas NKN" },
  { value: "perpus", label: "Upah Rehab Perpustakaan",      singkat: "Rehab Perpustakaan" },
  { value: "toilet", label: "Upah Pembangunan Toilet Baru", singkat: "Pembangunan Toilet Baru" }
];

// nama pekerjaan dari kodenya (singkat = tanpa kata "Upah")
window.pekerjaanLabel = (v, singkat = false) => {
  const p = window.MASTER.pekerjaan.find(x => x.value === v);
  return p ? (singkat ? p.singkat : p.label) : "Tanpa pekerjaan";
};
