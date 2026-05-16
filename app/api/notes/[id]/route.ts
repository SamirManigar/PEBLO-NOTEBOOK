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

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const note = await prisma.note.findUnique({
      where: { id: params.id },
      include: { tags: true }
    });

    if (!note || note.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { title, content, category, archived, tags, isPublic } = body;

    const note = await prisma.note.findUnique({
      where: { id: params.id },
      include: { tags: true }
    });

    if (!note || note.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Prepare tags update if provided
    let tagsUpdate = undefined;
    if (tags !== undefined) {
      tagsUpdate = {
        set: [], // remove existing
        connectOrCreate: tags.map((t: string) => ({
          where: { name: t },
          create: { name: t }
        }))
      };
    }

    const updatedNote = await prisma.note.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(category !== undefined && { category }),
        ...(archived !== undefined && { archived }),
        ...(isPublic !== undefined && { isPublic }),
        ...(tagsUpdate && { tags: tagsUpdate })
      },
      include: { tags: true }
    });

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error('Update note error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
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

    await prisma.note.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
