// ============================================================
//  CRUD TRANSAKSI + PENGATURAN + UPLOAD BUKTI
// ============================================================

// --- Pengaturan (pagu) ---
async function getPengaturan() {
  const { data, error } = await sb.from("pengaturan").select("*").eq("id", 1).single();
  if (error) throw error;
  return data;
}
async function setPagu(nilai) {
  const { error } = await sb.from("pengaturan")
    .update({ pagu_anggaran: nilai, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw error;
}

// --- Transaksi ---
async function fetchTransaksi(bulan = "all") {
  let q = sb.from("transaksi").select("*").order("tanggal", { ascending: true })
                                          .order("created_at", { ascending: true });
  if (bulan !== "all") {
    const [y, m] = bulan.split("-");
    const start = `${y}-${m}-01`;
    const end = new Date(y, m, 0).toISOString().slice(0, 10); // akhir bulan
    q = q.gte("tanggal", start).lte("tanggal", end);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

async function addTransaksi(t) {
  const { error } = await sb.from("transaksi").insert(t);
  if (error) throw error;
}
async function updateTransaksi(id, t) {
  // jika foto bukti diganti, catat URL lama agar filenya dihapus setelah update
  let urlLama = null;
  if (t.bukti_url) {
    const { data } = await sb.from("transaksi").select("bukti_url").eq("id", id).single();
    urlLama = data?.bukti_url || null;
  }
  const { error } = await sb.from("transaksi").update(t).eq("id", id);
  if (error) throw error;
  if (urlLama && urlLama !== t.bukti_url) await hapusFileBukti(urlLama);
}
async function deleteTransaksi(id) {
  // ambil URL bukti sebelum barisnya dihapus, lalu hapus juga filenya
  const { data } = await sb.from("transaksi").select("bukti_url").eq("id", id).single();
  const { error } = await sb.from("transaksi").delete().eq("id", id);
  if (error) throw error;
  if (data?.bukti_url) await hapusFileBukti(data.bukti_url);
}

// --- Upload bukti (dikompres dulu) ---
async function uploadBukti(file) {
  if (!file) return null;
  const { blob, ext } = await compressImage(file);
  const name = `${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage
    .from(window.APP_CONFIG.BUCKET)
    .upload(name, blob, { contentType: blob.type || "image/jpeg", upsert: false });
  if (error) throw error;
  const { data } = sb.storage.from(window.APP_CONFIG.BUCKET).getPublicUrl(name);
  return { url: data.publicUrl, size: blob.size, original: file.size };
}

// --- Hitung saldo berjalan + ringkasan ---
function hitungRingkasan(rows, pagu) {
  let masuk = 0, keluar = 0, pajak = 0, saldo = 0;
  const withSaldo = rows.map((r) => {
    if (r.jenis === "masuk") { masuk += r.nominal; saldo += r.nominal; }
    else { keluar += r.nominal; saldo -= r.nominal; }
    pajak += r.pajak_nominal || 0;
    return { ...r, saldoBerjalan: saldo };
  });
  return {
    rows: withSaldo,
    masuk, keluar, pajak,
    saldoAkhir: masuk - keluar,
    sisaBank: pagu - masuk,        // sisa dana di bank = pagu - pemasukan (penarikan)
    kasBendahara: masuk - keluar,  // saldo kas bendahara = saldo akhir transaksi
    serapan: pagu ? (keluar / pagu) * 100 : 0,
    jumlah: rows.length
  };
}

Object.assign(window, {
  getPengaturan, setPagu, fetchTransaksi, addTransaksi,
  updateTransaksi, deleteTransaksi, uploadBukti, hitungRingkasan
});

// ============================================================
//  PEMBERSIHAN FILE BUKTI DI STORAGE
// ============================================================

// Ambil nama file (path) dari URL publik Supabase Storage
function pathDariUrl(url) {
  if (!url) return null;
  const penanda = `/object/public/${window.APP_CONFIG.BUCKET}/`;
  const i = url.indexOf(penanda);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + penanda.length).split("?")[0]);
}

// Hapus satu file bukti berdasarkan URL-nya (gagal hapus file tidak menggagalkan proses)
async function hapusFileBukti(url) {
  const path = pathDariUrl(url);
  if (!path) return;
  const { error } = await sb.storage.from(window.APP_CONFIG.BUCKET).remove([path]);
  if (error) console.warn("Gagal menghapus file bukti:", path, error.message);
}

// Cari file di Storage yang tidak lagi dipakai transaksi mana pun
async function cariBuktiYatim() {
  const bucket = window.APP_CONFIG.BUCKET;

  // 1) semua file di bucket (per 1000)
  const semuaFile = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await sb.storage.from(bucket)
      .list("", { limit: 1000, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw error;
    data.filter(f => f.id && f.name !== ".emptyFolderPlaceholder")
        .forEach(f => semuaFile.push(f.name));
    if (data.length < 1000) break;
  }

  // 2) semua file yang masih dipakai transaksi (per 1000)
  const dipakai = new Set();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("transaksi")
      .select("bukti_url").not("bukti_url", "is", null)
      .range(from, from + 999);
    if (error) throw error;
    data.forEach(r => { const p = pathDariUrl(r.bukti_url); if (p) dipakai.add(p); });
    if (data.length < 1000) break;
  }

  // 3) file yatim = ada di Storage tapi tidak dipakai
  const yatim = semuaFile.filter(nama => !dipakai.has(nama));
  return { yatim, totalFile: semuaFile.length, dipakai: dipakai.size };
}

// Hapus daftar file (per 100 agar aman)
async function hapusBuktiYatim(daftar) {
  const bucket = window.APP_CONFIG.BUCKET;
  let terhapus = 0;
  for (let i = 0; i < daftar.length; i += 100) {
    const potong = daftar.slice(i, i + 100);
    const { error } = await sb.storage.from(bucket).remove(potong);
    if (error) throw error;
    terhapus += potong.length;
  }
  return terhapus;
}

Object.assign(window, { hapusFileBukti, cariBuktiYatim, hapusBuktiYatim });
