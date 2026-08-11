import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    // 1. Read files
    const filePathMatriks = path.join(process.cwd(), 'data', 'kipapp_matriks_data.json')
    const filePathData = path.join(process.cwd(), 'data', 'kipapp_data.json')

    if (!fs.existsSync(filePathMatriks) || !fs.existsSync(filePathData)) {
      return NextResponse.json({ success: false, error: 'Source JSON files not found in data folder' }, { status: 404 })
    }

    const matData = JSON.parse(fs.readFileSync(filePathMatriks, 'utf8'))
    const kipData = JSON.parse(fs.readFileSync(filePathData, 'utf8'))

    // 2. Clean existing records
    await prisma.activityLog.deleteMany()
    await prisma.assessment.deleteMany()
    await prisma.activityEvidence.deleteMany()
    await prisma.evidenceReuseRequest.deleteMany()
    await prisma.evidenceFile.deleteMany()
    await prisma.activityMember.deleteMany()
    await prisma.activity.deleteMany()
    if ((prisma as any).project) {
      await (prisma as any).project.deleteMany()
    }
    await prisma.annualPlan.deleteMany()
    await prisma.teamMember.deleteMany()
    await prisma.team.deleteMany()
    await prisma.user.deleteMany()

    // 3. Extract and map Users
    const userMap = new Map<string, {
      nip: string
      name: string
      username: string
      password: string
      role: 'admin' | 'ketua_tim' | 'anggota' | 'pimpinan'
    }>()

    // Add admin
    userMap.set('000000000000000000', {
      nip: '000000000000000000',
      name: 'System Administrator',
      username: 'admin',
      password: 'password123',
      role: 'admin'
    })

    const takenUsernames = new Set<string>(['admin', 'kepala', 'ketuatim', 'pegawai'])

    function getUniqueUsername(name: string, nip: string, role: string): string {
      // Map demo quick login users
      if (nip === '197608051999011001') return 'kepala' // Siswadi
      if (nip === '198204082011011007') return 'ketuatim' // Adharis
      if (nip === '198104242014061004') return 'pegawai' // Abdul Salam

      let base = name.split(',')[0].split(' ')[0].replace(/[^a-zA-Z]/g, '').toLowerCase()
      if (!base || base.length < 2) base = 'user'
      let username = base
      let counter = 1
      while (takenUsernames.has(username)) {
        username = `${base}${counter}`
        counter++
      }
      takenUsernames.add(username)
      return username
    }

    // Populate users from matriks data
    for (const entry of matData) {
      if (entry.status !== 'success' || !entry.data) continue
      for (const t of entry.data) {
        const level = t.leveltim // 1 or 2
        // Leader
        if (t.nipbaru && t.nama) {
          const leaderNip = t.nipbaru
          const leaderRole = level === 1 ? 'pimpinan' : 'ketua_tim'
          const existing = userMap.get(leaderNip)
          if (!existing || (leaderRole === 'pimpinan' && existing.role !== 'pimpinan') || (leaderRole === 'ketua_tim' && existing.role === 'anggota')) {
            userMap.set(leaderNip, {
              nip: leaderNip,
              name: t.nama,
              username: getUniqueUsername(t.nama, leaderNip, leaderRole),
              password: 'password123',
              role: leaderRole
            })
          }
        }

        // Members
        if (t.anggota) {
          for (const m of t.anggota) {
            if (!m.nipbaru || !m.nama) continue
            const nip = m.nipbaru
            const isKetua = m.isketua === 1
            const memberRole = isKetua ? (level === 1 ? 'pimpinan' : 'ketua_tim') : 'anggota'
            const existing = userMap.get(nip)
            if (!existing || (memberRole === 'pimpinan' && existing.role !== 'pimpinan') || (memberRole === 'ketua_tim' && existing.role === 'anggota')) {
              userMap.set(nip, {
                nip: nip,
                name: m.nama,
                username: getUniqueUsername(m.nama, nip, memberRole),
                password: 'password123',
                role: memberRole
              })
            }
          }
        }
      }
    }

    // Insert Users into DB
    const dbUsers = new Map<string, any>() // nip -> User record
    const usersData = Array.from(userMap.values())
    await prisma.user.createMany({
      data: usersData,
      skipDuplicates: true
    })

    const allUsers = await prisma.user.findMany()
    for (const u of allUsers) {
      dbUsers.set(u.nip, u)
    }

    // 4. Extract and create Teams
    const dbTeams = new Map<string, any>() // timkerjaid -> Team record
    const teamsToCreate = []
    const seenTeams = new Set<string>()
    for (const entry of matData) {
      if (entry.status !== 'success' || !entry.data) continue
      for (const t of entry.data) {
        if (!t.timkerjaid || !t.namatim) continue
        if (seenTeams.has(t.timkerjaid)) continue
        seenTeams.add(t.timkerjaid)
        teamsToCreate.push({
          name: t.namatim,
          description: `KipAPP Team Level ${t.leveltim}`,
          kipappId: t.timkerjaid
        })
      }
    }
    await prisma.team.createMany({
      data: teamsToCreate,
      skipDuplicates: true
    })

    const allTeams = await prisma.team.findMany()
    for (const t of allTeams) {
      dbTeams.set(t.kipappId, t)
    }

    // 5. Create Team Memberships
    const memberships = []
    const seenMemberships = new Set<string>()
    for (const entry of matData) {
      if (entry.status !== 'success' || !entry.data) continue
      for (const t of entry.data) {
        const teamRecord = dbTeams.get(t.timkerjaid)
        if (!teamRecord) continue

        if (t.anggota) {
          for (const m of t.anggota) {
            if (!m.nipbaru) continue
            const userRecord = dbUsers.get(m.nipbaru)
            if (!userRecord) continue

            const key = `${teamRecord.id}-${userRecord.id}`
            if (seenMemberships.has(key)) continue
            seenMemberships.add(key)

            memberships.push({
              teamId: teamRecord.id,
              userId: userRecord.id,
              role: m.isketua === 1 ? 'ketua' : 'anggota'
            })
          }
        }
      }
    }
    await prisma.teamMember.createMany({
      data: memberships,
      skipDuplicates: true
    })

    // 6. Create Annual Plans (RK)
    const plansToCreate = []
    const seenPlans = new Set<string>()
    const rkSourceMap = new Map<string, string>()

    for (const entry of matData) {
      if (entry.status !== 'success' || !entry.data) continue
      for (const t of entry.data) {
        if (t.anggota) {
          for (const m of t.anggota) {
            if (!m.nipbaru || !m.rencanakinerja) continue
            const userRecord = dbUsers.get(m.nipbaru)
            if (!userRecord) continue

            for (const rk of m.rencanakinerja) {
              if (!rk.id || !rk.rencanakinerja) continue
              if (seenPlans.has(rk.id)) continue
              seenPlans.add(rk.id)

              plansToCreate.push({
                title: rk.rencanakinerja,
                userId: userRecord.id,
                kipappId: rk.id,
                year: 2026
              })

              rkSourceMap.set(rk.id, rk.rkketuaid)
            }
          }
        }
      }
    }

    await prisma.annualPlan.createMany({
      data: plansToCreate,
      skipDuplicates: true
    })

    const allPlans = await prisma.annualPlan.findMany()
    const dbPlans = new Map<string, any>()
    for (const p of allPlans) {
      dbPlans.set(p.kipappId, p)
    }

    // Link parent-child hierarchy in batches to prevent database pool exhaustion
    const parentUpdates = []
    for (const [rkId, p] of dbPlans.entries()) {
      const parentKipappId = rkSourceMap.get(rkId)
      if (parentKipappId && parentKipappId !== rkId) {
        const parentPlan = dbPlans.get(parentKipappId)
        if (parentPlan) {
          parentUpdates.push({
            id: p.id,
            parentId: parentPlan.id
          })
        }
      }
    }

    const batchSize = 15
    for (let i = 0; i < parentUpdates.length; i += batchSize) {
      const batch = parentUpdates.slice(i, i + batchSize)
      await Promise.all(
        batch.map(update =>
          prisma.annualPlan.update({
            where: { id: update.id },
            data: { parentId: update.parentId }
          })
        )
      )
    }

    // 7. Create Projects (RK Proyek)
    const projectsToCreate = []
    const seenProjects = new Set<string>()
    for (const entry of kipData) {
      if (entry.status !== 'success' || !entry.data) continue
      for (const t of entry.data) {
        const teamRecord = dbTeams.get(t.id)
        if (!teamRecord) continue

        if (t.proyek) {
          for (const p of t.proyek) {
            if (!p.proyekid || !p.namaproyek) continue
            if (seenProjects.has(p.proyekid)) continue
            seenProjects.add(p.proyekid)

            const parentPlan = dbPlans.get(p.rkketuaid)
            projectsToCreate.push({
              name: p.namaproyek.trim(),
              kipappId: p.proyekid,
              teamId: teamRecord.id,
              annualPlanId: parentPlan ? parentPlan.id : null
            })
          }
        }
      }
    }
    await (prisma as any).project.createMany({
      data: projectsToCreate,
      skipDuplicates: true
    })

    // 8. Create dummy activity
    const targetUserNip = '198104242014061004'
    const targetUser = dbUsers.get(targetUserNip)
    
    if (targetUser) {
      const userPlans = allPlans.filter(p => p.userId === targetUser.id)
      if (userPlans.length > 0) {
        const act1 = await prisma.activity.create({
          data: {
            name: 'Penyusunan Kuesioner dan Dokumen Survei Triwulan',
            status: 'DINILAI',
            targetVolume: 12,
            unit: 'Dokumen',
            annualPlanId: userPlans[0].id,
            createdById: targetUser.id,
            dateSubmitted: new Date('2026-07-15'),
          }
        })

        await prisma.activityMember.create({
          data: { activityId: act1.id, userId: targetUser.id }
        })

        const evidence = await prisma.evidenceFile.create({
          data: {
            fileName: 'Dokumen Survei Q2 Sigi',
            driveLink: 'https://drive.google.com/drive/folders/demo-bps-sigi',
            uploadedById: targetUser.id
          }
        })

        await prisma.activityEvidence.create({
          data: { activityId: act1.id, evidenceFileId: evidence.id }
        })

        const teamMember = await prisma.teamMember.findFirst({
          where: { userId: targetUser.id }
        })
        if (teamMember) {
          const teamKetua = await prisma.teamMember.findFirst({
            where: { teamId: teamMember.teamId, role: 'ketua' }
          })
          if (teamKetua) {
            await prisma.assessment.create({
              data: {
                activityId: act1.id,
                evaluatorId: teamKetua.userId,
                capaian: 95,
                kepatuhan: 90,
                profesionalisme: 92,
                nilaiAkhir: 92.90,
                predikat: 'Sangat Baik',
                feedback: 'Kerja bagus, dokumen terkumpul lengkap dan sesuai jadwal.'
              }
            })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database SI-BUDI successfully repaired and synchronized with KipAPP source data!',
      summary: {
        usersCreated: userMap.size,
        teamsCreated: dbTeams.size,
        rkCreated: dbPlans.size,
        projectsCreated: projectsToCreate.length
      }
    })

  } catch (error: any) {
    console.error('Error seeding database:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
