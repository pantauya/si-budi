import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, oldPassword, newPassword } = body

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID tidak ditemukan' }, { status: 400 })
    }

    if (!oldPassword) {
      return NextResponse.json({ success: false, error: 'Password lama wajib diisi' }, { status: 400 })
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ success: false, error: 'Password baru minimal 6 karakter' }, { status: 400 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'Pengguna tidak ditemukan' }, { status: 404 })
    }

    // Check old password
    if (user.password !== oldPassword) {
      return NextResponse.json({ success: false, error: 'Password lama tidak sesuai' }, { status: 400 })
    }

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: newPassword }
    })

    // Log the action
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'CHANGE_PASSWORD',
        details: `User ${user.name} (${user.username}) berhasil memperbarui password.`
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Password berhasil diperbarui!'
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
