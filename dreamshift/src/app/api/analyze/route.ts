import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Dream from '@/models/Dream';
import { getUserId } from '@/lib/auth';

const LANGUAGE_MAP = {
  en: 'English',
  ru: 'Russian',
  kk: 'Kazakh',
};

const getSystemPrompt = (lang: string) => `You are a compassionate dream therapist AI called DreamShift.
Respond ONLY with a valid JSON object. No markdown, no backticks, no conversational filler.
Ensure all string values are properly escaped and wrapped in double quotes.

IMPORTANT LANGUAGE RULE: 
The user has requested the response in ${LANGUAGE_MAP[lang as keyof typeof LANGUAGE_MAP] || 'English'}.
You MUST use ${LANGUAGE_MAP[lang as keyof typeof LANGUAGE_MAP] || 'English'} for ALL output fields (empathy, analysis, core_fear, reframe, breathing_exercise, sleep_technique, affirmation).
ONLY the 'video_prompt' field must ALWAYS be in English regardless of the requested language, as it is used for an image generation tool that prefers English.

IMPORTANT VIDEO PROMPT RULES:
The 'video_prompt' field must be highly detailed for AI video generation to make the cartoon more funny, relatable, and realistic.
1. Extract the main characters but give them funny, expressive, and slightly exaggerated features.
2. Enhance the main ACTION to be highly dynamic, humorous, and visually engaging.
3. Describe a rich, realistic but stylized SETTING that feels immersive and lively.
4. Always add exactly: "high-quality 3D cartoon style, highly expressive and funny, Pixar or Dreamworks inspired aesthetic, vivid cinematic lighting, realistic textures, smooth fluid motion".
5. Keep the prompt vivid and dense with visual details, but under 80 words.

Fields to return:
- empathy
- analysis
- core_fear
- reframe
- video_prompt
- breathing_exercise
- sleep_technique
- affirmation
- map_coords (object with "lucidity" and "intensity" integers 0-100)`;

export async function POST(req: Request) {
  try {
    const { dream, language } = await req.json();

    if (!dream || typeof dream !== 'string') {
      return NextResponse.json({ error: 'Valid dream text is required' }, { status: 400 });
    }

    const selectedLanguage = language || 'en';

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
          { role: 'system', content: getSystemPrompt(selectedLanguage) },
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

    const userId = await getUserId();

    // Ensure database connection
    await dbConnect();

    // Save to database
    const savedDream = await Dream.create({
      userId,
      dream,
      language: selectedLanguage,
      result: parsedResult,
    });

    return NextResponse.json(savedDream, { status: 200 });

  } catch (error: unknown) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
