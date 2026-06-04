import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Dream from '@/models/Dream';

const SYSTEM_PROMPT = `You are a compassionate dream therapist AI called DreamShift.
Respond ONLY with a valid JSON object. No markdown, no backticks, no conversational filler.
Ensure all string values are properly escaped and wrapped in double quotes.

IMPORTANT LANGUAGE RULE: 
You MUST detect the language the user wrote their dream in, and use that EXACT SAME language for ALL output fields (empathy, analysis, core_fear, reframe, breathing_exercise, sleep_technique, affirmation, video_prompt).

IMPORTANT VIDEO PROMPT RULES:
The 'video_prompt' field must be highly detailed for AI video generation.
1. Extract specific characters from the dream (e.g. monsters, specific people, animals) and include them visually.
2. Extract the main ACTION (fighting, flying, running, falling, etc.).
3. Extract the SETTING (street, school, forest, unknown place, etc.).
4. Always add exactly: "cartoon animation style, Ghibli-inspired, vibrant colors, smooth motion".
5. Keep prompt under 100 words but dense with visual details.

Fields to return:
- empathy
- analysis
- core_fear
- reframe
- video_prompt
- breathing_exercise
- sleep_technique
- affirmation`;

export async function POST(req: Request) {
  try {
    const { dream } = await req.json();

    if (!dream || typeof dream !== 'string') {
      return NextResponse.json({ error: 'Valid dream text is required' }, { status: 400 });
    }

    // Call GitHub Models API
    const response = await fetch('https://models.github.ai/inference/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: dream },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('GitHub API error:', errorData);
      return NextResponse.json({ error: 'Failed to generate analysis' }, { status: 500 });
    }

    const data = await response.json();
    let rawResult = data.choices[0].message.content;

    // Extract JSON object using regex to handle potential leading/trailing text or markdown
    const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      rawResult = jsonMatch[0];
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(rawResult);
    } catch {
      console.error('Failed to parse JSON:', rawResult);
      console.error('Original model output:', data.choices[0].message.content);
      return NextResponse.json({ error: 'Model returned invalid JSON format' }, { status: 500 });
    }

    // Ensure database connection
    await dbConnect();

    // Save to database
    const savedDream = await Dream.create({
      dream,
      result: parsedResult,
    });

    return NextResponse.json(savedDream, { status: 200 });

  } catch (error: unknown) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
