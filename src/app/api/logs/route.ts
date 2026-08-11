import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('sibudi_session')

    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    let user;
    try {
      user = JSON.parse(decodeURIComponent(sessionCookie.value))
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const logs = await prisma.activityLog.findMany({
      include: {
        user: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ success: true, logs })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
