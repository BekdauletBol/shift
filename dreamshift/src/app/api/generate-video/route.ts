import { NextResponse } from "next/server";
import Replicate from "replicate";
import dbConnect from "@/lib/mongodb";
import Dream from "@/models/Dream";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: Request) {
  try {
    const { video_prompt, dreamId } = await req.json();

    if (!video_prompt) {
      return NextResponse.json({ error: "video_prompt is required" }, { status: 400 });
    }

    const prediction = await replicate.predictions.create({
      model: "wavespeedai/wan-2.1-t2v-480p",
      input: {
        prompt: video_prompt,
      }
    });

    return NextResponse.json({ id: prediction.id }, { status: 201 });
  } catch (error: unknown) {
    console.error("Video generation start error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to start video generation" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const dreamId = searchParams.get("dreamId");

    if (!id) {
      return NextResponse.json({ error: "Prediction ID is required" }, { status: 400 });
    }

    const prediction = await replicate.predictions.get(id);

    const status = prediction.status; // 'starting', 'processing', 'succeeded', 'failed', 'canceled'
    let outputUrl = null;

    if (status === "succeeded" && prediction.output) {
      let url = prediction.output;
      if (Array.isArray(url)) {
        url = url[0];
      }
      outputUrl = url;
      
      if (dreamId) {
        await dbConnect();
        await Dream.findByIdAndUpdate(dreamId, { video_url: outputUrl });
      }
    }

    return NextResponse.json(
      {
        status: status,
        output: outputUrl,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Video generation polling error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to poll video status" }, { status: 500 });
  }
}
