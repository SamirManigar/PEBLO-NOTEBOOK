import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  return verifyToken(token) as { id: string } | null;
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const note = await prisma.note.findUnique({
      where: { id: params.id }
    });

    if (!note || note.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (note.shareId && note.isPublic) {
      return NextResponse.json({ shareId: note.shareId });
    }

    const shareId = note.shareId || randomUUID();

    const updatedNote = await prisma.note.update({
      where: { id: params.id },
      data: {
        shareId,
        isPublic: true
      }
    });

    return NextResponse.json({ shareId: updatedNote.shareId });
  } catch (error) {
    console.error('Share note error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
