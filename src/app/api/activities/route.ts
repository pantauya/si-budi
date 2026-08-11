import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

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
    const { name, targetVolume, unit, annualPlanId, createdById, members, evidenceLink, createdAt } = body

    // 1. Create activity
    const activity = await prisma.activity.create({
      data: {
        name,
        targetVolume: parseFloat(targetVolume),
        unit,
        annualPlanId,
        createdById,
        status: 'SEDANG_BERLANGSUNG',
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

    // 5. Log activity
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
