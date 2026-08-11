import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const activities = await prisma.activity.findMany({
      where: {
        NOT: [
          { status: 'DINILAI' },
          { status: 'LENGKAP' }
        ]
      },
      include: {
        creator: true
      }
    })

    const now = new Date()
    const remindersSent: any[] = []
    const tukinDeductions: any[] = []

    for (const act of activities) {
      const createdTime = new Date(act.createdAt)
      const diffTime = Math.abs(now.getTime() - createdTime.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays >= 3 && diffDays < 5) {
        // Send email reminder simulation (H+3 to H+5)
        const emailContent = `Yth. ${act.creator.name},\n\nKegiatan "${act.name}" Anda telah berjalan selama ${diffDays} hari namun belum dilengkapi dengan bukti dukung. Harap segera mengunggah bukti dukung di SI-BUDI untuk menghindari pemotongan Tukin.\n\nSalam,\nAdmin SI-BUDI Sigi`
        
        // Log to database/console as simulation
        await prisma.activityLog.create({
          data: {
            userId: act.createdById,
            action: 'EMAIL_REMINDER',
            details: `Reminder email dikirim ke ${act.creator.username} untuk kegiatan "${act.name}" (H+${diffDays})`
          }
        })

        remindersSent.push({
          activityId: act.id,
          activityName: act.name,
          employee: act.creator.name,
          nip: act.creator.nip,
          email: `${act.creator.username}@bps.go.id`,
          daysElapsed: diffDays,
          status: 'Reminder Sent (Simulation)'
        })
      } else if (diffDays >= 5) {
        // H+5 Tukin cut recommendation (0.05%)
        tukinDeductions.push({
          activityId: act.id,
          activityName: act.name,
          employee: act.creator.name,
          nip: act.creator.nip,
          daysElapsed: diffDays,
          recommendedDeduction: '0.05%'
        })

        await prisma.activityLog.create({
          data: {
            userId: act.createdById,
            action: 'TUKIN_DEDUCTION_REC',
            details: `Rekomendasi potongan Tukin 0.05% diterapkan untuk kegiatan "${act.name}" (H+${diffDays})`
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      summary: {
        totalPendingActivities: activities.length,
        remindersSentCount: remindersSent.length,
        tukinDeductionsRecommendedCount: tukinDeductions.length
      },
      remindersSent,
      tukinDeductions
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
