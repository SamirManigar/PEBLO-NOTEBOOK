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

export async function GET(req: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const tag = searchParams.get('tag') || '';
    const category = searchParams.get('category') || '';

    // Build the query
    const where: any = {
      userId: user.id,
      archived: false,
    };

    if (query) {
      where.OR = [
        { title: { contains: query } },
        { content: { contains: query } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (tag) {
      where.tags = {
        some: {
          name: tag,
        },
      };
    }

    const notes = await prisma.note.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        tags: true,
      },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Fetch notes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { title, content, category, tags } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const note = await prisma.note.create({
      data: {
        title,
        content: content || '',
        category,
        userId: user.id,
        tags: tags && tags.length > 0 ? {
          connectOrCreate: tags.map((t: string) => ({
            where: { name: t },
            create: { name: t }
          }))
        } : undefined
      },
      include: {
        tags: true
      }
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error('Create note error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
