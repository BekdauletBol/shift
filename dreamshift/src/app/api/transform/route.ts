import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Dream from '@/models/Dream';

export async function POST(req: Request) {
  try {
    const { dream, core_fear, language } = await req.json();

    if (!dream || !core_fear) {
      return NextResponse.json({ error: 'Missing dream or core fear' }, { status: 400 });
    }

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
            content: `You are a dream therapist specializing in Imagery Rehearsal Therapy (IRT). 
            Your goal is to take a dream (often a nightmare) and the identified core fear, and rewrite it into a positive, empowering, or funny resolution.
            Respond ONLY with a valid JSON object. 
            Fields: 
            - "transformed_story": A short, empowering, and positive version of the dream. 
            - "explanation": Why this new version helps overcome the fear. 
            - "new_video_prompt": A funny, Pixar-style video prompt for this new version.
            Respond in the requested language: ${language || 'English'}. 
            HOWEVER, 'new_video_prompt' MUST be in English.` 
          },
          { role: 'user', content: `Original Dream: ${dream}\nCore Fear: ${core_fear}` },
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to transform dream');
    }

    const data = await response.json();
    let rawResult = data.choices[0].message.content;

    const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      rawResult = jsonMatch[0];
    }

    return NextResponse.json(JSON.parse(rawResult));

  } catch (error: any) {
    console.error('Transformation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
