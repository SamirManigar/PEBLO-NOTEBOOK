import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

function normalizeTags(tags: unknown) {
  if (!Array.isArray(tags)) return [];

  return Array.from(
    new Set(
      tags
        .filter((tag): tag is string => typeof tag === 'string')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function normalizeSearchTerm(value: string) {
  return value.trim().replace(/^#+/, '').toLowerCase();
}

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  const payload = verifyToken(token) as { id: string } | null;
  if (!payload) return null;
  
  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  return user;
}

export async function GET(req: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const tag = searchParams.get('tag') || '';
    const category = searchParams.get('category') || '';
    const archived = searchParams.get('archived') === 'true';
    const sort = searchParams.get('sort') || 'recent';

    const where: Prisma.NoteWhereInput = {
      userId: user.id,
      archived,
    };

    const normalizedQuery = normalizeSearchTerm(query);
    const normalizedTag = normalizeSearchTerm(tag);

    if (query.trim()) {
      const searchFilters: Prisma.NoteWhereInput[] = [
        { title: { contains: query.trim(), mode: 'insensitive' } },
        { content: { contains: query.trim(), mode: 'insensitive' } },
        { category: { contains: query.trim(), mode: 'insensitive' } },
      ];

      if (normalizedQuery) {
        searchFilters.push({
          tags: { some: { name: { contains: normalizedQuery, mode: 'insensitive' } } },
        });
      }

      where.OR = searchFilters;
    }

    if (category.trim()) {
      where.category = { equals: category.trim(), mode: 'insensitive' };
    }

    if (normalizedTag) {
      where.tags = {
        some: {
          name: { contains: normalizedTag, mode: 'insensitive' },
        },
      };
    }

    const orderBy: Prisma.NoteOrderByWithRelationInput =
      sort === 'oldest' ? { updatedAt: 'asc' }
      : sort === 'az'   ? { title: 'asc' }
      : sort === 'za'   ? { title: 'desc' }
      : { updatedAt: 'desc' };

    const notes = await prisma.note.findMany({
      where,
      orderBy,
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
    const normalizedTags = normalizeTags(tags);

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const note = await prisma.note.create({
      data: {
        title: title.trim(),
        content: content || '',
        category: category?.trim() || null,
        userId: user.id,
        tags: normalizedTags.length > 0 ? {
          connectOrCreate: normalizedTags.map((t: string) => ({
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
