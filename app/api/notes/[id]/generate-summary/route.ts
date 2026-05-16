import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

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

    if (!note.content || note.content.trim().length < 10) {
      return NextResponse.json({ error: 'Note content is too short for AI analysis' }, { status: 400 });
    }

    const apiKey = process.env.LLM_API_KEY;
    if (!apiKey || apiKey === "") {
      console.error('AI Configuration Error: LLM_API_KEY is missing or empty in .env');
      return NextResponse.json({ error: 'AI provider not configured. Please add LLM_API_KEY to your .env file.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `Analyze the following note content and provide a summary, extract action items, and suggest a better title.
    
    NOTE TITLE: ${note.title}
    NOTE CONTENT: ${note.content}
    
    Return a JSON object with exactly these keys:
    - summary (string)
    - action_items (string array)
    - suggested_title (string)`;

    let result;
    try {
      result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
        }
      });
    } catch (apiError: unknown) {
      console.error('Gemini API Error:', apiError);
      return NextResponse.json({ 
        error: `AI Service Error: ${getErrorMessage(apiError)}. Check if your API key is valid and the model name is correct.` 
      }, { status: 500 });
    }

    const responseText = result.response.text();
    let aiData;
    
    try {
      aiData = JSON.parse(responseText);
    } catch {
      console.error("Failed to parse AI JSON response:", responseText);
      return NextResponse.json({ error: 'AI returned an invalid data format.' }, { status: 500 });
    }

    const updatedNote = await prisma.note.update({
      where: { id: params.id },
      data: {
        aiSummary: typeof aiData.summary === 'string' ? aiData.summary : '',
        aiActions: JSON.stringify(Array.isArray(aiData.action_items) ? aiData.action_items : []),
        aiUsedCount: { increment: 1 }
      },
      include: { tags: true }
    });

    return NextResponse.json({
      note: updatedNote,
      suggested_title: typeof aiData.suggested_title === 'string' ? aiData.suggested_title : null
    });
  } catch (error: unknown) {
    console.error('AI generation Internal Error:', error);
    return NextResponse.json({ error: `Internal Server Error: ${getErrorMessage(error)}` }, { status: 500 });
  }
}
