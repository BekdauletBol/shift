import { NextResponse } from "next/server";
import Replicate from "replicate";
import dbConnect from "@/lib/mongodb";
import Dream from "@/models/Dream";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: Request) {
  try {
    const { mood_prompt, dreamId } = await req.json();

    if (!mood_prompt) {
      return NextResponse.json({ error: "mood_prompt is required" }, { status: 400 });
    }

    const prediction = await replicate.predictions.create({
      model: "facebookresearch/musicgen:671ac645ce5e52d6397358c3a377bc7a2aa39924fccd3da6da4d693e9079237f",
      input: {
        prompt: `Ambient cinematic soundscape: ${mood_prompt}. Dreamy, ethereal, high quality, immersive.`,
        duration: 15,
        model_version: "melody"
      }
    });

    return NextResponse.json({ id: prediction.id }, { status: 201 });
  } catch (error: unknown) {
    console.error("Audio generation start error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to start audio generation" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Prediction ID is required" }, { status: 400 });
    }

    const prediction = await replicate.predictions.get(id);
    const status = prediction.status;
    let outputUrl = prediction.output;

    return NextResponse.json({ status, output: outputUrl }, { status: 200 });
  } catch (error: unknown) {
    console.error("Audio generation polling error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to poll audio status" }, { status: 500 });
  }
}
