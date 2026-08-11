# Rencana Implementasi: Aplikasi SI-BUDI (Sistem Informasi Bukti Dukung & Evaluasi Kinerja)

Melanjutkan pembuatan aplikasi SI-BUDI berdasarkan panduan di [SI-BUDI_Plan_Ringkas.md](file:///d:/Latsar/Aplikasi/SI-BUDI_Plan_Ringkas.md). Aplikasi ini akan dikembangkan menggunakan Next.js 15 (App Router), TypeScript, Tailwind CSS, Prisma, dan Supabase (PostgreSQL + Auth), serta disiapkan untuk dijalankan di lokal dan dideploy ke Vercel.

---

## User Review Required

> [!IMPORTANT]
> **Prasyarat & Konfigurasi Awal**:
> 1. Pengguna harus menyiapkan proyek di **Supabase** (untuk PostgreSQL database & Supabase Auth).
> 2. Menyiapkan kredensial Google Cloud Service Account untuk integrasi Google Drive API (jika ingin fitur upload langsung ke Shared Drive instansi berjalan).
> 3. Membuat file `.env` di lokal dengan variabel koneksi database dan kredensial Supabase.

---

## Open Questions

> [!NOTE]
> Apakah Anda ingin kami langsung menginisialisasi proyek Next.js 15 baru di dalam folder saat ini (`d:\Latsar\Aplikasi`), atau membuat sub-folder baru (misal `si-budi`) agar tidak menimpa file mockup SPA HTML yang ada?
>
> *Rekomendasi: Menginisialisasi langsung di `d:\Latsar\Aplikasi` dan memindahkan file mockup HTML lama ke folder cadangan/arsip.*

---

## Proposed Changes

### 1. Inisialisasi Proyek Next.js 15
Menginisialisasi proyek Next.js 15 dengan TypeScript dan Tailwind CSS menggunakan `create-next-app`.

#### [NEW] [package.json](file:///d:/Latsar/Aplikasi/package.json)
#### [NEW] [tsconfig.json](file:///d:/Latsar/Aplikasi/tsconfig.json)
#### [NEW] [next.config.ts](file:///d:/Latsar/Aplikasi/next.config.ts)

---

### 2. Database & ORM (Prisma + Supabase)
Setup skema database relasional di Prisma sesuai dengan entitas di plan ringkas.

#### [NEW] [schema.prisma](file:///d:/Latsar/Aplikasi/prisma/schema.prisma)
Definisi tabel:
- `User` (id, nip, name, username, role, dsb.)
- `Team` dan `TeamMember`
- `AnnualPlan` (SKP Tahunan)
- `Activity` (Kegiatan Bulanan) dan `ActivityMember`
- `EvidenceFile` dan `ActivityEvidence`
- `EvidenceReuseRequest`
- `Assessment` (Penilaian capaian, kepatuhan, profesionalisme)
- `ActivityLog`

---

### 3. Otentikasi & RBAC Middleware
Integrasi Supabase Auth dengan middleware Next.js untuk membatasi akses halaman berdasarkan Role (Admin, Ketua Tim, Anggota, Pimpinan).

#### [NEW] [middleware.ts](file:///d:/Latsar/Aplikasi/middleware.ts)
#### [NEW] [auth-listener](file:///d:/Latsar/Aplikasi/src/app/api/auth/route.ts)

---

### 4. Implementasi UI / Halaman Utama (Porting dari SPA Mockup)
Porting dan peningkatan kualitas tampilan visual (premium style, dark mode support, glassmorphism) dari mockup `index.html` ke komponen React.

#### [NEW] [layout.tsx](file:///d:/Latsar/Aplikasi/src/app/layout.tsx)
#### [NEW] [page.tsx (Dashboard)](file:///d:/Latsar/Aplikasi/src/app/dashboard/page.tsx)
#### [NEW] [login page](file:///d:/Latsar/Aplikasi/src/app/login/page.tsx)

---

### 5. Integrasi Google Drive API & Upload Bukti
Service / route helper untuk melakukan upload ke Shared Google Drive menggunakan Service Account credentials.

#### [NEW] [drive.ts](file:///d:/Latsar/Aplikasi/src/lib/drive.ts)
#### [NEW] [upload route](file:///d:/Latsar/Aplikasi/src/app/api/upload/route.ts)

---

## Panduan Menjalankan di Lokal & Deploy ke Vercel

### A. Cara Menjalankan di Terminal Lokal
1. **Instalasi Dependensi**:
   ```bash
   npm install
   ```
2. **Setup Environment Variables**:
   Buat file `.env` di root direktori dengan isi:
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres"
   NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-ID].supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="[ANON-KEY]"
   GOOGLE_SERVICE_ACCOUNT_KEY='{"type": "service_account", ...}'
   DRIVE_SHARED_FOLDER_ID="[FOLDER-ID]"
   ```
3. **Migrasi Database**:
   ```bash
   npx prisma db push
   ```
4. **Jalankan Development Server**:
   ```bash
   npm run dev
   ```
5. Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

### B. Cara Deploy ke Vercel
1. **Install Vercel CLI** (jika belum ada):
   ```bash
   npm install -g vercel
   ```
2. **Login ke Vercel**:
   ```bash
   vercel login
   ```
3. **Inisialisasi & Deploy**:
   Jalankan perintah ini di root folder proyek:
   ```bash
   vercel
   ```
   Ikuti petunjuk di terminal untuk menghubungkan proyek baru.
4. **Konfigurasi Environment Variables**:
   Masuk ke dashboard Vercel, buka menu *Settings > Environment Variables*, lalu masukkan semua variabel yang ada di file `.env` lokal Anda.
5. **Redeploy**:
   ```bash
   vercel --prod
   ```

---

## Verification Plan

### Automated Tests
- Menjalankan `npm run build` untuk memastikan tidak ada error TypeScript maupun error build Next.js.
- Menjalankan `npx prisma validate` untuk memverifikasi validitas skema Prisma.

### Manual Verification
- Uji alur login menggunakan kredensial dummy.
- Uji tambah kegiatan baru dan verifikasi data tersimpan di Supabase PostgreSQL.
- Verifikasi hak akses (RBAC) pada masing-masing role.
