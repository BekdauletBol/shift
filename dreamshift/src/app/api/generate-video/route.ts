import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY;
const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY;

function generateKlingToken() {
  if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
    throw new Error("Kling API keys are not configured");
  }

  const payload = {
    iss: KLING_ACCESS_KEY,
    exp: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
    nbf: Math.floor(Date.now() / 1000) - 5,
  };

  return jwt.sign(payload, KLING_SECRET_KEY, { algorithm: "HS256" });
}

export async function POST(req: Request) {
  try {
    const { video_prompt } = await req.json();

    if (!video_prompt) {
      return NextResponse.json({ error: "video_prompt is required" }, { status: 400 });
    }

    const enhancedPrompt = `${video_prompt}, Studio Ghibli style, cartoon, healing, warm light, cinematic`;
    const token = generateKlingToken();

    const response = await fetch("https://api.klingai.com/v1/videos/text2video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model_name: "kling-v2-5-turbo",
        mode: "std",
        prompt: enhancedPrompt,
        duration: 5,
        aspect_ratio: "16:9",
      }),
    });

    const data = await response.json();

    if (!response.ok || data.code !== 0) {
      console.error("Kling API error:", data);

      let errorMessage = data.message || "Failed to start generation";
      let status = response.status === 200 ? 400 : response.status;

      // Specifically handle insufficient balance
      if (data.code === 1102) {
        errorMessage = "Your Kling AI account balance is insufficient. Please top up your account at klingai.com to generate videos.";
        status = 402; // Payment Required
      }

      return NextResponse.json({ error: errorMessage }, { status });
    }

    return NextResponse.json({ id: data.data.task_id }, { status: 201 });
  } catch (error: unknown) {
    console.error("Video generation start error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to start video generation" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Prediction ID is required" }, { status: 400 });
    }

    const token = generateKlingToken();
    const response = await fetch(`https://api.klingai.com/v1/videos/tasks/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok || data.code !== 0) {
      console.error("Kling API polling error:", data);
      return NextResponse.json({ error: data.message || "Failed to poll video status" }, { status: 500 });
    }

    const task = data.data;
    // Map Kling status to what frontend expects if possible, 
    // but the frontend checks for "succeeded", "failed", "canceled"
    // Kling status: submitted, processing, succeeded, failed, canceled
    
    const status = task.task_status;
    let output = null;

    if (status === "succeeded" && task.task_result?.videos?.length > 0) {
      output = task.task_result.videos[0].url;
    }

    return NextResponse.json(
      {
        status: status,
        output: output,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Video generation polling error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to poll video status" }, { status: 500 });
  }
}
