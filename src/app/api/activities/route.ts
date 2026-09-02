import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')

    let activities;

    if (role === 'admin' || role === 'pimpinan') {
      activities = await prisma.activity.findMany({
        include: {
          annualPlan: true,
          creator: true,
          members: { include: { user: true } },
          evidences: { include: { evidenceFile: true } },
          assessments: true
        },
        orderBy: { createdAt: 'desc' }
      })
    } else if (role === 'ketua_tim' && userId) {
      // Fetch team activities, activities created by user, where they are members, or created by anggota
      activities = await prisma.activity.findMany({
        where: {
          OR: [
            { createdById: userId },
            { members: { some: { userId } } },
            { creator: { role: 'anggota' } }
          ]
        },
        include: {
          annualPlan: true,
          creator: true,
          members: { include: { user: true } },
          evidences: { include: { evidenceFile: true } },
          assessments: true
        },
        orderBy: { createdAt: 'desc' }
      })
    } else if (userId) {
      // Ordinary member - only their own activities
      activities = await prisma.activity.findMany({
        where: {
          OR: [
            { createdById: userId },
            { members: { some: { userId } } }
          ]
        },
        include: {
          annualPlan: true,
          creator: true,
          members: { include: { user: true } },
          evidences: { include: { evidenceFile: true } },
          assessments: true
        },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      activities = await prisma.activity.findMany({
        include: {
          annualPlan: true,
          creator: true,
          members: { include: { user: true } },
          evidences: { include: { evidenceFile: true } },
          assessments: true
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    return NextResponse.json({ success: true, activities })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, targetVolume, unit, output, annualPlanId, createdById, members, evidenceLink, createdAt, startDate, endDate, bidang, ro, aktivitas } = body

    // Check if annualPlanId exists in DB to prevent Foreign Key constraint errors
    let validAnnualPlanId = null
    if (annualPlanId) {
      const existingPlan = await prisma.annualPlan.findUnique({
        where: { id: annualPlanId }
      })
      if (existingPlan) {
        validAnnualPlanId = annualPlanId
      }
    }

    // 1. Create activity
    const activity = await prisma.activity.create({
      data: {
        name,
        targetVolume: parseFloat(targetVolume),
        unit,
        output: output ? output.trim() : null,
        annualPlanId: validAnnualPlanId,
        createdById,
        status: 'SEDANG_BERLANGSUNG',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        ...(createdAt ? { createdAt: new Date(createdAt) } : {})
      }
    })

    // 2. Add creator as member
    await prisma.activityMember.create({
      data: {
        activityId: activity.id,
        userId: createdById
      }
    })

    // 3. Add tagged members
    if (members && Array.isArray(members)) {
      for (const memberId of members) {
        if (memberId !== createdById) {
          await prisma.activityMember.create({
            data: {
              activityId: activity.id,
              userId: memberId
            }
          })
        }
      }
    }

    // 4. Add evidence link if provided
    if (evidenceLink) {
      const file = await prisma.evidenceFile.create({
        data: {
          fileName: `Bukti - ${name}`,
          driveLink: evidenceLink,
          uploadedById: createdById
        }
      })

      await prisma.activityEvidence.create({
        data: {
          activityId: activity.id,
          evidenceFileId: file.id
        }
      })

      await prisma.activity.update({
        where: { id: activity.id },
        data: { status: 'MENUNGGU_BUKTI' }
      })
    }

    // 5. Auto-save or update recommendation in database for team consistency
    if (name && unit) {
      try {
        const trimmedRincian = name.trim()
        const trimmedSatuan = unit.trim()
        const trimmedOutput = output ? output.trim() : null

        let inferredBidang = bidang || null
        if (!inferredBidang && createdById) {
          const userWithTeam = await prisma.user.findUnique({
            where: { id: createdById },
            include: { teamMemberships: { include: { team: true } } }
          })
          if (userWithTeam?.teamMemberships?.[0]?.team?.name) {
            inferredBidang = userWithTeam.teamMemberships[0].team.name
          }
        }

        const existingRec = await prisma.activityRecommendation.findFirst({
          where: {
            rincian: { equals: trimmedRincian, mode: 'insensitive' }
          }
        })

        if (existingRec) {
          await prisma.activityRecommendation.update({
            where: { id: existingRec.id },
            data: {
              satuan: trimmedSatuan,
              outputRincian: trimmedOutput || existingRec.outputRincian,
              bidang: inferredBidang || existingRec.bidang,
              ro: ro || existingRec.ro,
              aktivitas: aktivitas || existingRec.aktivitas,
              usageCount: { increment: 1 }
            }
          })
        } else {
          await prisma.activityRecommendation.create({
            data: {
              rincian: trimmedRincian,
              satuan: trimmedSatuan,
              outputRincian: trimmedOutput,
              bidang: inferredBidang || 'Umum',
              ro: ro || null,
              aktivitas: aktivitas || null,
              usageCount: 1,
              createdById: createdById || null
            }
          })
        }
      } catch (recErr) {
        console.error('Error auto-saving activity recommendation:', recErr)
      }
    }

    // 6. Log activity
    await prisma.activityLog.create({
      data: {
        userId: createdById,
        action: 'CREATE_ACTIVITY',
        details: `Membuat kegiatan bulanan: ${name}`
      }
    })

    return NextResponse.json({ success: true, activity })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
