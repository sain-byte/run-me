LOG RUN — SAIN BYTE UI REVISION

Isi paket:
- index.html, logic.js, auth.js, profile.js, story.js, story-logo.js
- sw.js, site.webmanifest
- icon dan favicon asli dari upload

Perubahan utama:
1. Header dirapikan dengan identitas Sain Byte.
2. Tombol akun membuka modal biodata di tengah layar.
3. Detail profil menampilkan biodata dan tautan sosial yang dapat dibuka.
4. Foto profil dapat diketuk untuk melihat ukuran lebih besar.
5. Edit profil memakai form dan mekanisme foto/crop yang sudah ada.
6. Setting akun berisi ganti password dan keluar.
7. Kategori aktivitas dapat diketuk untuk melihat daftar sesi dan ringkasan.
8. Modal PB dan Story dipusatkan, dengan tinggi maksimum dan scroll internal.
9. Skala UI mendukung 80%, 85%, 90%, 95%, dan 100%; default 80% tetap dipertahankan.
10. Tombol input dibuat sejajar; Edit/Hapus pada kartu riwayat memakai ikon ringkas.

Catatan:
- API/backend Google Apps Script tidak diubah.
- Database dan format data tidak diubah.
- Semua file frontend lama dan aset ikon dipertahankan.
- Periksa URL API di logic.js sebelum deploy bila deployment backend berubah.
\n\nREVISION V2:\n- Header minimal tanpa kotak tombol; judul hanya Log Run.\n- Biodata profil ditampilkan sebagai baris berikon.\n- Tautan profil menggunakan grid tetap agar TikTok tidak meloncat saat empat tautan aktif.\n