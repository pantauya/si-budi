import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { id } = params
    const body = await request.json()
    const { evaluatorId, capaian, kepatuhan, profesionalisme, feedback } = body

    // 1. Calculate final grade
    // capaian 50%, kepatuhan 30%, profesionalisme 20%
    const score = (parseFloat(capaian) * 0.5) + (parseFloat(kepatuhan) * 0.3) + (parseFloat(profesionalisme) * 0.2)

    // 2. Determine predicate
    let predicate = 'Kurang'
    if (score >= 90) predicate = 'Sangat Baik'
    else if (score >= 80) predicate = 'Baik'
    else if (score >= 70) predicate = 'Cukup'
    else if (score >= 60) predicate = 'Kurang'

    // 3. Create assessment
    const assessment = await prisma.assessment.create({
      data: {
        activityId: id,
        evaluatorId,
        capaian: parseFloat(capaian),
        kepatuhan: parseFloat(kepatuhan),
        profesionalisme: parseFloat(profesionalisme),
        nilaiAkhir: score,
        predikat: predicate,
        feedback
      }
    })

    // 4. Update activity status
    await prisma.activity.update({
      where: { id },
      data: { status: 'DINILAI' }
    })

    // 5. Log activity
    await prisma.activityLog.create({
      data: {
        userId: evaluatorId,
        action: 'ASSESS_ACTIVITY',
        details: `Menilai kegiatan ID ${id} dengan nilai ${score.toFixed(2)} (${predicate})`
      }
    })

    return NextResponse.json({ success: true, assessment })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
