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
      console.error("Video generation failed: video_prompt is missing");
      return NextResponse.json({ error: "video_prompt is required" }, { status: 400 });
    }

    console.log("Starting video generation with prompt:", video_prompt);

    // Using Wan 2.1 which is very fast and high quality
    const prediction = await replicate.predictions.create({
      // You can also use "lucataco/wan-2.1-t2v-480p:a9e3d9..." for specific versions
      model: "wavespeedai/wan-2.1-t2v-480p",
      input: {
        prompt: video_prompt,
        aspect_ratio: "16:9",
        num_frames: 81, // ~5 seconds at 16fps
      }
    });

    console.log("Replicate prediction started, ID:", prediction.id);

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
    const status = prediction.status;

    console.log(`Prediction ${id} status: ${status}`);

    let outputUrl = null;

    if (status === "succeeded" && prediction.output) {
      let url = prediction.output;
      // Some models return an array, some a single string
      if (Array.isArray(url)) {
        url = url[0];
      }
      outputUrl = url;
      
      console.log(`Video generated successfully for dream ${dreamId}: ${outputUrl}`);
      
      if (dreamId) {
        await dbConnect();
        await Dream.findByIdAndUpdate(dreamId, { video_url: outputUrl });
      }
    } else if (status === "failed") {
      console.error(`Prediction ${id} failed:`, prediction.error);
    }

    return NextResponse.json(
      {
        status: status,
        output: outputUrl,
        error: prediction.error,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Video generation polling error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to poll video status" }, { status: 500 });
  }
}
