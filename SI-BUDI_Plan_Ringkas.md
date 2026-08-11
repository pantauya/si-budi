# SI-BUDI — Implementation Plan (Ringkas)

## Stack
- Next.js 15 + TS, Tailwind + shadcn/ui
- Supabase PostgreSQL + Prisma
- Supabase Auth (final, bukan Auth.js)
- Google Drive API (Shared Drive instansi)
- Vercel Cron + Vercel Hosting

## Posisi Produk
Alat bantu internal, bukan pengganti e-Kinerja/SIASN. Hasil tetap direkap manual ke sistem resmi.

## Entitas Database
- users (role: admin/ketua_tim/anggota/pimpinan)
- teams, team_members
- annual_plans
- activities (status: Belum Dilaksanakan → Sedang Berlangsung → Menunggu Bukti → Lengkap → Dinilai)
- activity_members
- evidence_files (uploaded_by, uploaded_at, drive_link)
- activity_evidence (relasi many-to-many, untuk reuse bukti)
- evidence_reuse_requests (approval Ketua Tim)
- assessments (capaian 50%, kepatuhan 30%, profesionalisme 20% — cek dasar Permenpan RB SKP)
- activity_log

## Hak Akses
| Role | Akses |
|---|---|
| Admin | Full: pegawai, tim, RKT |
| Ketua Tim | Buat kegiatan, tetapkan anggota, approve reuse bukti |
| Anggota | Upload bukti, lihat kegiatan sendiri |
| Pimpinan | Read-only dashboard |

## Roadmap

**Tahap 1**
- Setup project + Supabase + Prisma
- Auth + RBAC + RLS policy
- CRUD pegawai/tim/RKT/kegiatan
- Upload bukti ke Drive instansi
- activity_log dasar
- Dashboard status

**Tahap 2**
- Modul penilaian (verifikasi bobot ke regulasi dulu)
- Cron reminder tenggat
- Reuse bukti + approval flow
- Rekap bulanan

**Tahap 3**
- Audit trail lengkap
- Analitik
- Ekspor laporan
- Integrasi sistem lain (opsional)

## Urutan Kerja
1. Schema + RLS
2. Auth + middleware role
3. CRUD dasar
4. Upload bukti
5. Dashboard
6. Penilaian + reminder
