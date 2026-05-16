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
      where: { userId: user.id, archived: false }
    });

    const archivedNotes = await prisma.note.count({
      where: { userId: user.id, archived: true }
    });

    const recentNotes = await prisma.note.findMany({
      where: { userId: user.id, archived: false },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    const aiUsedCount = await prisma.note.aggregate({
      where: { userId: user.id, archived: false },
      _sum: { aiUsedCount: true }
    });

    const topTags = await prisma.tag.findMany({
      where: {
        notes: {
          some: { userId: user.id, archived: false }
        }
      },
      include: {
        notes: {
          where: { userId: user.id, archived: false },
          select: { id: true }
        }
      },
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyNotes = await prisma.note.findMany({
      where: {
        userId: user.id,
        updatedAt: { gte: sevenDaysAgo }
      },
      select: { updatedAt: true }
    });

    const weeklyBreakdown = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(sevenDaysAgo);
      date.setDate(sevenDaysAgo.getDate() + index + 1);
      const key = date.toISOString().slice(0, 10);

      return {
        date: key,
        label: date.toLocaleDateString(undefined, { weekday: 'short' }),
        count: weeklyNotes.filter((note) => note.updatedAt.toISOString().slice(0, 10) === key).length
      };
    });

    const rankedTags = topTags
      .map((tag) => ({ name: tag.name, count: tag.notes.length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      totalNotes,
      archivedNotes,
      recentNotes,
      aiUsage: aiUsedCount._sum.aiUsedCount || 0,
      topTags: rankedTags,
      weeklyActivity: weeklyNotes.length,
      weeklyBreakdown
    });
  } catch (error) {
    console.error('Insights error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
