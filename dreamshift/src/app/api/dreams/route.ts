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
    const dreams = await Dream.find({ userId }).sort({ createdAt: -1 });

    return NextResponse.json(dreams);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
