"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Wind, Moon, Brain, Sparkles, Heart, Video, Loader2, Download } from "lucide-react";
import { DreamAnalysisResponse } from "@/types/dream";

export default function DreamResult({ result }: { result: DreamAnalysisResponse }) {
  const [copied, setCopied] = useState(false);
  const [videoStatus, setVideoStatus] = useState<"idle" | "generating" | "success" | "error">("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [predictionId, setPredictionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.video_prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateVideo = async () => {
    setVideoStatus("generating");
    setVideoUrl(null);
    setPredictionId(null);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_prompt: result.video_prompt }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start generation");
      }
      
      setPredictionId(data.id);
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred");
      setVideoStatus("error");
    }
  };

  useEffect(() => {
    if (!predictionId || videoStatus !== "generating") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/generate-video?id=${predictionId}`);
        if (!res.ok) throw new Error("Polling failed");
        const data = await res.json();

        if (data.status === "succeeded") {
          setVideoUrl(data.output);
          setVideoStatus("success");
          clearInterval(interval);
        } else if (data.status === "failed" || data.status === "canceled") {
          setVideoStatus("error");
          clearInterval(interval);
        }
      } catch (err) {
        console.error(err);
        setVideoStatus("error");
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [predictionId, videoStatus]);

  const handleDownload = async () => {
    if (!videoUrl) return;
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "dream-video.mp4";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download failed:", err);
      // Fallback if cross-origin blob fetch fails
      window.open(videoUrl, '_blank');
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      <motion.div variants={item} className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
        <h3 className="flex items-center gap-2 text-xl font-serif mb-3 text-orange">
          <Heart className="w-5 h-5" /> Compassion
        </h3>
        <p className="text-black/80 leading-relaxed">{result.empathy}</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div variants={item} className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
          <h3 className="flex items-center gap-2 text-xl font-serif mb-3 text-black">
            <Brain className="w-5 h-5 text-orange" /> Analysis
          </h3>
          <p className="text-black/80 leading-relaxed">{result.analysis}</p>
        </motion.div>

        <motion.div variants={item} className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
          <h3 className="flex items-center gap-2 text-xl font-serif mb-3 text-black">
            <Sparkles className="w-5 h-5 text-orange" /> Positive Reframe
          </h3>
          <p className="text-black/80 leading-relaxed">{result.reframe}</p>
        </motion.div>
      </div>

      <motion.div variants={item} className="bg-black text-white p-6 rounded-2xl shadow-lg relative flex flex-col gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-xl font-serif mb-3 text-orange">
            <Video className="w-5 h-5" /> Video Prompt (Sora/Runway/Kling)
          </h3>
          <p className="text-white/90 leading-relaxed font-mono text-sm bg-white/10 p-4 rounded-xl relative pr-12">
            {result.video_prompt}
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
              title="Copy video prompt"
            >
              {copied ? <Check className="w-4 h-4 text-orange" /> : <Copy className="w-4 h-4" />}
            </button>
          </p>
        </div>
        
        {/* Video Generation Section */}
        <div className="border-t border-white/10 pt-4 mt-2 flex flex-col items-center gap-4">
          {videoStatus === "idle" && (
            <button
              onClick={handleGenerateVideo}
              className="bg-orange hover:bg-[#e55a2b] text-white font-medium py-3 px-6 rounded-xl transition-all shadow-lg flex items-center gap-2"
            >
              <Video className="w-5 h-5" /> Generate Cartoon Video
            </button>
          )}

          {videoStatus === "generating" && (
            <div className="flex items-center gap-3 text-white/80 font-medium bg-white/5 py-3 px-6 rounded-xl">
              <Loader2 className="w-5 h-5 animate-spin text-orange" />
              Generating your dream video...
            </div>
          )}

          {videoStatus === "error" && (
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="text-red-400 font-medium max-w-md">
                {errorMessage || "Generation failed, try again"}
              </p>
              <button
                onClick={handleGenerateVideo}
                className="bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-lg transition-all text-sm"
              >
                Retry
              </button>
            </div>
          )}

          {videoStatus === "success" && videoUrl && (
            <div className="w-full flex flex-col items-center gap-4 mt-2">
              <div className="w-full max-w-lg aspect-video rounded-xl overflow-hidden bg-black/50 border border-white/10 shadow-inner">
                <video src={videoUrl} autoPlay loop playsInline className="w-full h-full object-cover" />
              </div>
              <button
                onClick={handleDownload}
                className="bg-white text-black hover:bg-cream font-medium py-3 px-6 rounded-xl transition-all shadow-lg flex items-center gap-2"
              >
                <Download className="w-5 h-5" /> Download Video
              </button>
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div variants={item} className="bg-orange/10 p-6 rounded-2xl border border-orange/20">
          <h3 className="flex items-center gap-2 text-xl font-serif mb-3 text-black">
            <Wind className="w-5 h-5 text-orange" /> 4-7-8 Breathing
          </h3>
          <p className="text-black/80 leading-relaxed">{result.breathing_exercise}</p>
        </motion.div>

        <motion.div variants={item} className="bg-[#111111] p-6 rounded-2xl text-white">
          <h3 className="flex items-center gap-2 text-xl font-serif mb-3 text-orange">
            <Moon className="w-5 h-5" /> Sleep Technique
          </h3>
          <p className="text-white/80 leading-relaxed">{result.sleep_technique}</p>
        </motion.div>
      </div>

      <motion.div variants={item} className="text-center py-8">
        <h3 className="text-sm uppercase tracking-widest text-black/50 font-bold mb-4">Grounding Affirmation</h3>
        <p className="font-serif text-3xl md:text-4xl text-orange italic">&ldquo;{result.affirmation}&rdquo;</p>
      </motion.div>
    </motion.div>
  );
}
