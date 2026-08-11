import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { id } = params
    const body = await request.json()
    const { status, evidenceLink, userId } = body

    let activity = await prisma.activity.findUnique({ where: { id } })
    if (!activity) {
      return NextResponse.json({ success: false, error: 'Kegiatan tidak ditemukan' }, { status: 404 })
    }

    // Update evidence link if provided
    if (evidenceLink) {
      // Check if evidence already exists
      const existingEvidence = await prisma.activityEvidence.findFirst({
        where: { activityId: id },
        include: { evidenceFile: true }
      })

      if (existingEvidence) {
        await prisma.evidenceFile.update({
          where: { id: existingEvidence.evidenceFileId },
          data: { driveLink: evidenceLink }
        })
      } else {
        const file = await prisma.evidenceFile.create({
          data: {
            fileName: `Bukti - ${activity.name}`,
            driveLink: evidenceLink,
            uploadedById: userId || activity.createdById
          }
        })

        await prisma.activityEvidence.create({
          data: {
            activityId: id,
            evidenceFileId: file.id
          }
        })
      }
    }

    // Update activity fields
    const updated = await prisma.activity.update({
      where: { id },
      data: {
        status: status || activity.status,
        dateSubmitted: evidenceLink ? new Date() : activity.dateSubmitted
      },
      include: {
        annualPlan: true,
        creator: true,
        members: { include: { user: true } },
        evidences: { include: { evidenceFile: true } },
        assessments: true
      }
    })

    // Log the update activity
    await prisma.activityLog.create({
      data: {
        userId: userId || activity.createdById,
        action: 'UPDATE_ACTIVITY',
        details: `Memperbarui status/bukti kegiatan: ${activity.name}`
      }
    })

    return NextResponse.json({ success: true, activity: updated })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const activity = await prisma.activity.findUnique({ where: { id } })
    if (!activity) {
      return NextResponse.json({ success: false, error: 'Kegiatan tidak ditemukan' }, { status: 404 })
    }

    await prisma.activity.delete({ where: { id } })

    // Log the delete activity
    if (userId) {
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'DELETE_ACTIVITY',
          details: `Menghapus kegiatan: ${activity.name}`
        }
      })
    }

    return NextResponse.json({ success: true, message: 'Kegiatan berhasil dihapus' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
