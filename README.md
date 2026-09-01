# Aplikasi SPK Sederhana (Metode SAW)

Aplikasi web sederhana untuk **Sistem Pendukung Keputusan (SPK)** menggunakan metode
**SAW (Simple Additive Weighting)**. Dibuat dengan HTML, CSS, dan JavaScript murni —
tanpa dependensi dan tanpa proses build.

## Fitur

- Menambah/menghapus **kriteria** beserta bobot dan tipe (*benefit* atau *cost*).
- Menambah/menghapus **alternatif** beserta nilainya pada setiap kriteria.
- Normalisasi bobot otomatis (total bobot dijadikan 1).
- Menampilkan **bobot ternormalisasi**, **matriks ternormalisasi (R)**, dan **peringkat** alternatif.
- Validasi masukan dengan pesan kesalahan berbahasa Indonesia.
- Data tersimpan otomatis di `localStorage` peramban, plus tombol contoh data dan reset.

## Cara Menjalankan

Buka `index.html` langsung di peramban, atau jalankan lewat server statis:

```bash
npm start        # menjalankan http-server pada http://localhost:8080
```

## Menjalankan Pengujian

Pengujian memakai test runner bawaan Node.js (Node 18+), tanpa dependensi tambahan:

```bash
npm test
```

## Metode SAW

1. **Normalisasi bobot**: `w_j = bobot_j / Σ bobot`
2. **Normalisasi matriks keputusan**:
   - Kriteria *benefit*: `r_ij = x_ij / max(x_j)`
   - Kriteria *cost*: `r_ij = min(x_j) / x_ij`
3. **Nilai preferensi**: `V_i = Σ (w_j × r_ij)`
4. Alternatif dengan nilai `V` terbesar adalah alternatif terbaik.

## Struktur Proyek

```
index.html          # antarmuka aplikasi
assets/style.css    # gaya tampilan
src/saw.js          # logika perhitungan & validasi SAW (dipakai browser dan Node.js)
src/app.js          # logika antarmuka (render tabel, event, penyimpanan lokal)
test/saw.test.js    # pengujian unit untuk src/saw.js
```
