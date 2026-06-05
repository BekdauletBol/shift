import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Dream from '@/models/Dream';

export async function GET() {
  try {
    await dbConnect();
    // Only return dreams that are public and have a video
    const dreams = await Dream.find({ isPublic: true, video_url: { $exists: true } })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json(dreams);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
