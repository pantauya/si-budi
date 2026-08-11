import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user || user.password !== password) {
      return NextResponse.json({ success: false, error: 'Username atau password salah!' }, { status: 401 })
    }

    // Set local session cookie for demo fallback
    const cookieStore = await cookies()
    cookieStore.set('sibudi_session', JSON.stringify({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      nip: user.nip
    }), {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 // 1 day
    })

    // Log the login activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        details: `User ${user.name} masuk ke sistem.`
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        nip: user.nip
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
