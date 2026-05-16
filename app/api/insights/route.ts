import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  return verifyToken(token) as { id: string } | null;
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const totalNotes = await prisma.note.count({
      where: { userId: user.id }
    });

    const recentNotes = await prisma.note.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    const aiUsedCount = await prisma.note.aggregate({
      where: { userId: user.id },
      _sum: { aiUsedCount: true }
    });

    // Tag counts - Many-to-many relation
    // We fetch tags and count how many notes each has
    const topTags = await prisma.tag.findMany({
      where: {
        notes: {
          some: { userId: user.id }
        }
      },
      include: {
        _count: {
          select: { notes: true }
        }
      },
      orderBy: {
        notes: {
          _count: 'desc'
        }
      },
      take: 5
    });

    // Weekly activity - fetch notes updated in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyNotes = await prisma.note.findMany({
      where: {
        userId: user.id,
        updatedAt: { gte: sevenDaysAgo }
      },
      select: { updatedAt: true }
    });

    return NextResponse.json({
      totalNotes,
      recentNotes,
      aiUsage: aiUsedCount._sum.aiUsedCount || 0,
      topTags: topTags.map(t => ({ name: t.name, count: t._count.notes })),
      weeklyActivity: weeklyNotes.length
    });
  } catch (error) {
    console.error('Insights error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
