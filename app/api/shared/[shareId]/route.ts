import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, context: { params: Promise<{ shareId: string }> }) {
  try {
    const params = await context.params;
    const note = await prisma.note.findUnique({
      where: { shareId: params.shareId },
      include: {
        user: {
          select: { name: true }
        },
        tags: true
      }
    });

    if (!note || !note.isPublic) {
      return NextResponse.json({ error: 'Not found or not public' }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
