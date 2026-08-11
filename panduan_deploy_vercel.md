# Panduan Lengkap Deploy Aplikasi SI-BUDI ke Vercel

Panduan ini menjelaskan langkah-langkah lengkap untuk mengunggah dan mendeploy aplikasi **SI-BUDI** (Next.js + Prisma + Supabase + Google Drive API) ke platform **Vercel**.

---

## 📋 Prasyarat Sebelum Deploy

Sebelum memulai, pastikan Anda telah menyiapkan hal-hal berikut:
1. **Akun GitHub / GitLab / Bitbucket**: Tempat untuk meng-hosting repositori kode Anda.
2. **Akun Vercel**: Daftar gratis di [vercel.com](https://vercel.com) menggunakan akun GitHub Anda.
3. **Database Supabase**: URL database PostgreSQL Anda (`DATABASE_URL`).
4. **Google Drive Credentials**: Client ID, Client Secret, Refresh Token, dan Folder ID.

---

## 🚀 Metode 1: Deploy Menggunakan Integrasi GitHub (Sangat Direkomendasikan)

Metode ini adalah cara paling mudah karena Vercel akan otomatis melakukan deploy ulang setiap kali Anda melakukan `git push` ke repositori Anda.

### Langkah 1: Push Kode ke GitHub
1. Buat repositori baru di GitHub (misal: `si-budi`).
2. Hubungkan folder lokal Anda ke GitHub dan push kodenya:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - SI-BUDI"
   git branch -M main
   git remote add origin https://github.com/USERNAME/NAMA_REPOSITORI.git
   git push -u origin main
   ```

### Langkah 2: Hubungkan Repositori ke Vercel
1. Buka [Vercel Dashboard](https://vercel.com/dashboard).
2. Klik tombol **Add New...** dan pilih **Project**.
3. Pada daftar repositori, cari repositori `si-budi` Anda, lalu klik **Import**.

### Langkah 3: Konfigurasi Project di Vercel
1. **Framework Preset**: Vercel otomatis mendeteksi **Next.js**.
2. **Root Directory**: Biarkan `./`.
3. **Environment Variables**: Ini bagian paling penting. Buka bagian *Environment Variables* dan masukkan variabel dari file `.env` lokal Anda:
   
   | Nama Variabel (Key) | Nilai (Value) | Keterangan |
   | --- | --- | --- |
   | `DATABASE_URL` | `postgresql://...` | Connection String Database Supabase |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://...` | URL API Supabase Anda |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_pub...` | Anon Key Supabase Anda |
   | `GOOGLE_DRIVE_FOLDER_ID` | `1K7...` | ID Folder Google Drive target upload |
   | `GOOGLE_CLIENT_ID` | `976...` | Google OAuth Client ID |
   | `GOOGLE_CLIENT_SECRET` | `GOC...` | Google OAuth Client Secret |
   | `GOOGLE_REFRESH_TOKEN` | `1//...` | Google OAuth Refresh Token |

4. Klik tombol **Deploy**.

---

## 💻 Metode 2: Deploy Menggunakan Vercel CLI (Alternatif Terminal Lokal)

Jika Anda tidak ingin mengunggah kode ke GitHub terlebih dahulu, Anda bisa langsung mendeploy dari terminal lokal Anda menggunakan Vercel CLI.

### Langkah 1: Instalasi Vercel CLI
Instal CLI secara global melalui npm:
```bash
npm install -g vercel
```

### Langkah 2: Login ke Akun Vercel
Jalankan perintah berikut dan ikuti instruksi di browser untuk otentikasi:
```bash
vercel login
```

### Langkah 3: Inisialisasi Proyek & Deploy Pertama
Jalankan perintah berikut di direktori utama proyek (`d:\Latsar\Aplikasi`):
```bash
vercel
```
Anda akan ditanya beberapa hal, jawab seperti berikut:
- *Set up and deploy?* **yes**
- *Which scope?* Pilih akun Anda.
- *Link to existing project?* **no**
- *What's your project's name?* Ketik `si-budi` (atau tekan Enter untuk default).
- *In which directory is your code located?* Tekan Enter (`./`).
- *Want to modify settings?* **no** (Vercel akan otomatis mengenali Next.js).

### Langkah 4: Tambahkan Environment Variables
Anda harus menambahkan variabel lingkungan melalui dashboard Vercel:
1. Buka tautan proyek yang dihasilkan di terminal.
2. Masuk ke **Settings > Environment Variables**.
3. Tambahkan semua variabel dari tabel di Metode 1.

### Langkah 5: Deploy ke Produksi (Final)
Setelah menambahkan environment variables, lakukan build produksi dengan menjalankan:
```bash
vercel --prod
```

---

## 🔄 Sinkronisasi Database Prisma setelah Deploy

Ketika aplikasi Next.js dideploy ke Vercel, pastikan database Anda sudah tersinkronisasi. 
1. Di lokal, jalankan `npx prisma db push` untuk memastikan skema tabel di Supabase sudah up-to-date.
2. Skrip build Next.js di Vercel otomatis menjalankan kompilasi Prisma Client.

---

## 🛠️ Pemecahan Masalah (Troubleshooting)

* **Error: PrismaClientInitializationError**
  * *Solusi*: Pastikan `DATABASE_URL` di Vercel Environment Variables sudah benar dan database Supabase Anda aktif serta tidak memblokir koneksi luar.
* **Error: Upload file ke Google Drive Gagal**
  * *Solusi*: Pastikan Google OAuth credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`) diisi dengan benar tanpa tanda kutip di Dashboard Vercel.
