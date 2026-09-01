import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

// Helper to auto-seed recommendations if table is empty
async function ensureRecommendationsSeeded() {
  try {
    const count = await prisma.activityRecommendation.count()
    if (count === 0) {
      const recsPath = path.join(process.cwd(), 'public', 'recommendations.json')
      if (fs.existsSync(recsPath)) {
        const recsJson = JSON.parse(fs.readFileSync(recsPath, 'utf8'))
        if (Array.isArray(recsJson) && recsJson.length > 0) {
          const batchSize = 100
          for (let i = 0; i < recsJson.length; i += batchSize) {
            const chunk = recsJson.slice(i, i + batchSize).map((item: any) => ({
              bidang: item.bidang || 'Umum',
              ro: item.ro || null,
              aktivitas: item.aktivitas || null,
              rincian: item.rincian || '',
              outputRincian: item.outputRincian || null,
              satuan: item.satuan || 'Kegiatan',
              usageCount: 1
            })).filter((item: any) => item.rincian.trim() !== '')

            if (chunk.length > 0) {
              await prisma.activityRecommendation.createMany({
                data: chunk,
                skipDuplicates: true
              })
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Error auto-seeding recommendations:', err)
  }
}

export async function GET(request: Request) {
  try {
    await ensureRecommendationsSeeded()

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const bidang = searchParams.get('bidang')
    const limit = parseInt(searchParams.get('limit') || '500', 10)

    let whereClause: any = {}

    if (bidang && bidang !== 'Semua') {
      whereClause.bidang = { equals: bidang, mode: 'insensitive' }
    }

    if (q && q.trim()) {
      const searchTerms = q.trim().split(/\s+/).filter(Boolean)
      whereClause.AND = searchTerms.map(term => ({
        OR: [
          { rincian: { contains: term, mode: 'insensitive' } },
          { ro: { contains: term, mode: 'insensitive' } },
          { aktivitas: { contains: term, mode: 'insensitive' } },
          { bidang: { contains: term, mode: 'insensitive' } },
          { outputRincian: { contains: term, mode: 'insensitive' } },
          { satuan: { contains: term, mode: 'insensitive' } },
        ]
      }))
    }

    const recommendations = await prisma.activityRecommendation.findMany({
      where: whereClause,
      orderBy: [
        { usageCount: 'desc' },
        { updatedAt: 'desc' }
      ],
      take: limit
    })

    return NextResponse.json({ success: true, recommendations })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { rincian, satuan, outputRincian, bidang, ro, aktivitas, userId } = body

    if (!rincian || !rincian.trim()) {
      return NextResponse.json({ success: false, error: 'Uraian kegiatan (rincian) wajib diisi' }, { status: 400 })
    }

    if (!satuan || !satuan.trim()) {
      return NextResponse.json({ success: false, error: 'Satuan wajib diisi' }, { status: 400 })
    }

    const trimmedRincian = rincian.trim()
    const trimmedSatuan = satuan.trim()
    const trimmedOutput = outputRincian ? outputRincian.trim() : null
    const trimmedBidang = bidang ? bidang.trim() : 'Umum'
    const trimmedRo = ro ? ro.trim() : null
    const trimmedAktivitas = aktivitas ? aktivitas.trim() : null

    // Check if recommendation already exists by rincian (case-insensitive)
    const existing = await prisma.activityRecommendation.findFirst({
      where: {
        rincian: { equals: trimmedRincian, mode: 'insensitive' }
      }
    })

    let recommendation
    if (existing) {
      recommendation = await prisma.activityRecommendation.update({
        where: { id: existing.id },
        data: {
          satuan: trimmedSatuan,
          outputRincian: trimmedOutput || existing.outputRincian,
          bidang: trimmedBidang !== 'Umum' ? trimmedBidang : existing.bidang,
          ro: trimmedRo || existing.ro,
          aktivitas: trimmedAktivitas || existing.aktivitas,
          usageCount: { increment: 1 }
        }
      })
    } else {
      recommendation = await prisma.activityRecommendation.create({
        data: {
          rincian: trimmedRincian,
          satuan: trimmedSatuan,
          outputRincian: trimmedOutput,
          bidang: trimmedBidang,
          ro: trimmedRo,
          aktivitas: trimmedAktivitas,
          usageCount: 1,
          createdById: userId || null
        }
      })
    }

    return NextResponse.json({ success: true, recommendation })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
