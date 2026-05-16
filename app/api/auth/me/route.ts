import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const payload = verifyToken(token) as { id: string } | null;
    if (!payload) {
      return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, name: true, email: true }
    });

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}
