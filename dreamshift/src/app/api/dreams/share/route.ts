import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Dream from '@/models/Dream';
import { getUserId } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { dreamId, isPublic } = await req.json();
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const dream = await Dream.findOneAndUpdate(
      { _id: dreamId, userId },
      { isPublic },
      { new: true }
    );

    if (!dream) {
      return NextResponse.json({ error: 'Dream not found' }, { status: 404 });
    }

    return NextResponse.json(dream);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
