"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Wind, Moon, Brain, Sparkles, Heart, Video, Loader2, Download } from "lucide-react";
import { DreamAnalysisResponse, Language } from "@/types/dream";
import { translations } from "@/lib/translations";

export default function DreamResult({ result, dreamId, language }: { result: DreamAnalysisResponse, dreamId: string | null, language: Language }) {
  const [copied, setCopied] = useState(false);
  const [videoStatus, setVideoStatus] = useState<"idle" | "generating" | "success" | "error">("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [predictionId, setPredictionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const t = translations[language];

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
        body: JSON.stringify({ video_prompt: result.video_prompt, dreamId }),
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
    if (videoStatus !== "generating") {
      setProgress(0);
      return;
    }

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 98) return prev;
        const increment = prev < 80 ? 1 : 0.2;
        return prev + increment;
      });
    }, 1500);

    return () => clearInterval(progressInterval);
  }, [videoStatus]);

  useEffect(() => {
    if (!predictionId || videoStatus !== "generating") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/generate-video?id=${predictionId}&dreamId=${dreamId || ""}`);
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
    <motion.div variants={container} initial="hidden" animate="show" className="w-full max-w-4xl mx-auto flex flex-col gap-4 sm:gap-6 px-1 sm:px-0">
      <motion.div variants={item} className="bg-white/5 p-5 sm:p-6 rounded-2xl shadow-sm border border-milk/5">
        <h3 className="flex items-center gap-2 text-lg sm:text-xl font-serif mb-2 sm:mb-3 text-orange">
          <Heart className="w-5 h-5 flex-shrink-0" /> {t.compassion}
        </h3>
        <p className="text-milk/80 leading-relaxed text-sm sm:text-base">{result.empathy}</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <motion.div variants={item} className="bg-white/5 p-5 sm:p-6 rounded-2xl shadow-sm border border-milk/5">
          <h3 className="flex items-center gap-2 text-lg sm:text-xl font-serif mb-2 sm:mb-3 text-milk">
            <Brain className="w-5 h-5 text-orange flex-shrink-0" /> {t.analysis}
          </h3>
          <p className="text-milk/80 leading-relaxed text-sm sm:text-base">{result.analysis}</p>
        </motion.div>

        <motion.div variants={item} className="bg-white/5 p-5 sm:p-6 rounded-2xl shadow-sm border border-milk/5">
          <h3 className="flex items-center gap-2 text-lg sm:text-xl font-serif mb-2 sm:mb-3 text-milk">
            <Sparkles className="w-5 h-5 text-orange flex-shrink-0" /> {t.reframe}
          </h3>
          <p className="text-milk/80 leading-relaxed text-sm sm:text-base">{result.reframe}</p>
        </motion.div>
      </div>

      <motion.div variants={item} className="bg-milk/5 text-milk p-5 sm:p-6 rounded-2xl shadow-lg relative flex flex-col gap-4 border border-milk/10">
        <div>
          <h3 className="flex items-center gap-2 text-lg sm:text-xl font-serif mb-2 sm:mb-3 text-orange">
            <Video className="w-5 h-5 flex-shrink-0" /> {t.videoPrompt}
          </h3>
          <p className="text-milk/90 leading-relaxed font-mono text-xs sm:text-sm bg-navy/50 p-3 sm:p-4 rounded-xl relative pr-10 sm:pr-12 break-words border border-milk/5">
            {result.video_prompt}
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-2 rounded-lg bg-milk/10 hover:bg-milk/20 transition-colors flex items-center justify-center active:scale-95"
              title="Copy video prompt"
            >
              {copied ? <Check className="w-4 h-4 text-orange" /> : <Copy className="w-4 h-4" />}
            </button>
          </p>
        </div>
        
        {/* Video Generation Section */}
        <div className="border-t border-milk/10 pt-4 mt-2 flex flex-col items-center gap-4">
          {videoStatus === "idle" && (
            <button
              onClick={handleGenerateVideo}
              className="bg-orange hover:bg-[#e55a2b] w-full sm:w-auto text-white font-medium py-3 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
            >
              <Video className="w-5 h-5" /> {t.generateVideo}
            </button>
          )}

          {videoStatus === "generating" && (
            <div className="w-full flex flex-col items-center gap-3 text-milk/80 font-medium py-3 px-4 sm:px-6 rounded-xl text-center text-sm sm:text-base">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-orange flex-shrink-0" />
                <span>{t.generatingVideo}</span>
              </div>
              <div className="w-full max-w-sm bg-milk/10 rounded-full h-2.5 mt-2 overflow-hidden">
                <div 
                  className="bg-orange h-2.5 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${Math.round(progress)}%` }}
                ></div>
              </div>
            </div>
          )}

          {videoStatus === "error" && (
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="text-red-400 font-medium max-w-md">
                {errorMessage || t.error}
              </p>
              <button
                onClick={handleGenerateVideo}
                className="bg-milk/10 hover:bg-milk/20 text-milk font-medium py-2 px-4 rounded-lg transition-all text-sm"
              >
                {t.retry}
              </button>
            </div>
          )}

          {videoStatus === "success" && videoUrl && (
            <div className="w-full flex flex-col items-center gap-4 mt-2">
              <div className="w-full max-w-lg aspect-video rounded-xl overflow-hidden bg-black/50 border border-milk/10 shadow-inner">
                <video src={videoUrl} autoPlay loop playsInline controls className="w-full h-full object-cover" />
              </div>
              <button
                onClick={handleDownload}
                className="bg-milk text-navy hover:bg-milk/90 font-medium py-3 px-6 w-full sm:w-auto rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
              >
                <Download className="w-5 h-5 flex-shrink-0" /> {t.downloadVideo}
              </button>
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <motion.div variants={item} className="bg-orange/5 p-5 sm:p-6 rounded-2xl border border-orange/10">
          <h3 className="flex items-center gap-2 text-lg sm:text-xl font-serif mb-2 sm:mb-3 text-milk">
            <Wind className="w-5 h-5 text-orange flex-shrink-0" /> {t.breathing}
          </h3>
          <p className="text-milk/80 leading-relaxed text-sm sm:text-base">{result.breathing_exercise}</p>
        </motion.div>

        <motion.div variants={item} className="bg-white/5 p-5 sm:p-6 rounded-2xl text-milk border border-milk/5">
          <h3 className="flex items-center gap-2 text-lg sm:text-xl font-serif mb-2 sm:mb-3 text-orange">
            <Moon className="w-5 h-5 flex-shrink-0" /> {t.sleepTechnique}
          </h3>
          <p className="text-milk/80 leading-relaxed text-sm sm:text-base">{result.sleep_technique}</p>
        </motion.div>
      </div>

      <motion.div variants={item} className="text-center py-6 sm:py-8 px-2">
        <h3 className="text-xs sm:text-sm uppercase tracking-widest text-milk/30 font-bold mb-3 sm:mb-4">{t.affirmationLabel}</h3>
        <p className="font-serif text-2xl sm:text-3xl md:text-4xl text-orange italic leading-tight">&ldquo;{result.affirmation}&rdquo;</p>
      </motion.div>
    </motion.div>
  );
}
