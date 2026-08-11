# Walkthrough: Pengerjaan Aplikasi SI-BUDI

Aplikasi **SI-BUDI** (Sistem Informasi Bukti Dukung & Evaluasi Kinerja) telah sukses ditingkatkan dari mockup statis menjadi aplikasi web modern berbasis **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, dan **Prisma ORM** + **Supabase Database & Auth**.

---

## 🛠️ Perubahan yang Dilakukan

1. **Inisialisasi Kerangka Proyek**: Menginisialisasi Next.js 15 (App Router) dengan TypeScript dan konfigurasi Tailwind CSS.
2. **Definisi Skema Database (Prisma)**: Membuat model relasional lengkap di [schema.prisma](file:///d:/Latsar/Aplikasi/prisma/schema.prisma) untuk entitas `User`, `Team`, `AnnualPlan` (SKP), `Activity` (Kegiatan Bulanan), `Assessment`, dan `ActivityLog`.
3. **Konfigurasi Auth & RBAC**: Menyusun integrasi Supabase Auth serta session middleware pelindung rute `/dashboard`.
4. **Porting UI/UX**: Membuat antarmuka premium di halaman Login dan Dashboard dengan Glassmorphism, Micro-animations, dan Dark mode yang menakjubkan.
5. **Endpoint API Lengkap**:
   - `/api/auth/login` dan `/api/auth/logout` untuk sistem login multi-role.
   - `/api/activities` untuk CRUD Kegiatan Bulanan dan tautan Bukti Dukung.
   - `/api/activities/[id]/assess` untuk penilaian berbobot oleh Ketua Tim (Capaian 50%, Kepatuhan 30%, Profesionalisme 20%).
   - `/api/seed` untuk kemudahan inisialisasi data demonstrasi/testing.

---

## 🚀 Panduan Menjalankan di Terminal Lokal

Ikuti langkah-langkah di bawah ini untuk menjalankan aplikasi di komputer lokal Anda:

### 1. Menginstal Dependensi
Di terminal root proyek Anda (`d:\Latsar\Aplikasi`), jalankan perintah:
```bash
npm install
```

### 2. Konfigurasi Environment Variables (`.env`)
Buat berkas bernama `.env` di direktori utama proyek, lalu isi dengan konfigurasi database Supabase Anda:
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-ID].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[ANON-KEY]"
```

### 3. Sinkronisasi Database
Jalankan perintah berikut untuk menerapkan skema tabel ke database Supabase Anda:
```bash
npx prisma db push
```

### 4. Menjalankan Server Development
Jalankan perintah:
```bash
npm run dev
```
Buka browser dan akses **[http://localhost:3000](http://localhost:3000)**. 
> [!TIP]
> Anda dapat masuk ke dasbor secara instan dengan mengeklik salah satu tombol **Demo Quick Login** di halaman login. Klik tombol **Sinkronisasikan Sekarang** di tab Integrasi KipAPP untuk mengisi database otomatis dengan data demo lengkap.

---

## ☁️ Panduan Deploy ke Vercel

Untuk mendeploy aplikasi ini ke cloud menggunakan Vercel:

### Langkah 1: Hubungkan ke Repositori Git (Direkomendasikan)
1. Push kode Anda ke repositori GitHub / GitLab / Bitbucket.
2. Masuk ke **[Vercel Dashboard](https://vercel.com)**.
3. Klik **Add New > Project**, pilih repositori SI-BUDI Anda.

### Langkah 2: Konfigurasi Variabel Lingkungan di Vercel
Pada bagian konfigurasi proyek di Vercel sebelum menekan tombol *Deploy*, tambahkan variabel lingkungan (Environment Variables) berikut:
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Langkah 3: Build & Deploy
1. Klik **Deploy**. Vercel akan otomatis mendeteksi proyek Next.js dan menjalankan build produksi.
2. Proyek Anda akan aktif dalam hitungan menit dan Anda akan mendapatkan domain publik gratis dari Vercel!
