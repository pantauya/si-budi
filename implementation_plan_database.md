# Implementation Plan - Database Repair & Alignment with KipAPP Source Data

Align the SI-BUDI database schema and initial data (seeder) with the teams, team members, and various performance plans (RK Ketua Tim, RK Anggota, RK Proyek) sourced from the `data` folder.

## Proposed Changes

### 1. Schema Modifications

Update [schema.prisma](file:///d:/Latsar/Aplikasi/prisma/schema.prisma) to model the relationships of RK Ketua Tim, RK Anggota, and RK Proyek (Projects) precisely.

#### [MODIFY] [schema.prisma](file:///d:/Latsar/Aplikasi/prisma/schema.prisma)
- Add `kipappId` (optional, unique) to `User` and `Team` to map database records to KipAPP data source.
- Update `AnnualPlan` (which represents Rencana Kinerja) to support a parent-child hierarchy. This allows `RK Anggota` to link to `RK Ketua Tim` (via `rkketuaid` from the source data) and `RK Ketua Tim` to link to the `Pimpinan's RK`.
- Add a new `Project` model (representing `RK Proyek` / projects under each team) which connects a `Team` and optionally an `AnnualPlan` (RK Ketua Tim).
- Link `Activity` (kegiatan bulanan) to `Project` optionally.

### 2. Seeder / Sync Update

Update the seed endpoint [route.ts](file:///d:/Latsar/Aplikasi/src/app/api/seed/route.ts) to read the source data files (`data/kipapp_matriks_data.json` and `data/kipapp_data.json`), parse the teams, members, and plans, and populate the database cleanly.

#### [MODIFY] [route.ts](file:///d:/Latsar/Aplikasi/src/app/api/seed/route.ts)
- Read JSON files dynamically from the `data` folder.
- Clean existing database records.
- Insert all users extracted from the members list. Map roles:
  - `pimpinan` for Level 1 team leader (Kepala BPS).
  - `ketua_tim` for Level 2 team leaders.
  - `anggota` for other team members.
  - Default fallback/demo accounts (like `admin`).
- Insert Teams, TeamMembers.
- Insert AnnualPlans (RKs):
  - First, insert Level 1 RKs (Pimpinan).
  - Second, insert Level 2 RKs (Ketua Tim), linking them to Pimpinan's RKs.
  - Third, insert Anggota RKs, linking them to Ketua's RKs using `rkketuaid`.
- Insert Projects (RK Proyek), linking them to Teams and Ketua's RKs using `rkketuaid`.

## Verification Plan

### Automated Tests
- Run `npx prisma validate` to check the validity of the updated schema.
- Run `npx prisma db push` to apply the updated schema to Supabase.
- Test the seed endpoint by calling it (using a scratch script or command line fetch) or clicking sync in the UI.

### Manual Verification
- Verify the populated database tables (Users, Teams, Team Members, AnnualPlans, Projects) by checking Supabase or executing a query script.
