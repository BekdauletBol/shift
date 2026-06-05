import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Dream from '@/models/Dream';
import { getUserId } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const dreams = await Dream.find({ userId }).sort({ createdAt: -1 }).limit(20);

    if (dreams.length < 2) {
      return NextResponse.json({ error: 'Not enough dreams to analyze yet. Keep journaling!' }, { status: 400 });
    }

    const dreamTexts = dreams.map(d => d.dream).join('\n---\n');

    // Call GitHub Models API for meta-analysis
    const response = await fetch('https://models.github.ai/inference/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert dream psychologist. Analyze the provided dream journal entries and identify recurring symbols, persistent emotional themes, and psychological growth or patterns. Respond ONLY with a valid JSON object containing fields: "symbols" (array of objects with "name" and "meaning"), "themes" (array of strings), and "summary" (short paragraph).' 
          },
          { role: 'user', content: `Here are my dreams from the last few weeks:\n\n${dreamTexts}` },
        ],
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate insights');
    }

    const data = await response.json();
    let rawResult = data.choices[0].message.content;

    const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      rawResult = jsonMatch[0];
    }

    return NextResponse.json(JSON.parse(rawResult));

  } catch (error: any) {
    console.error('Insights error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
