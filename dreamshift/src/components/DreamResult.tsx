"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Wind, Moon, Brain, Sparkles, Heart, Video, Loader2, Download, Wand2, ShieldCheck, Share2, Music, Play, Pause, ExternalLink } from "lucide-react";
import { DreamAnalysisResponse, Language } from "@/types/dream";
import { translations } from "@/lib/translations";

export default function DreamResult({ result, dreamId, language }: { result: DreamAnalysisResponse, dreamId: string | null, language: Language }) {
  const [copied, setCopied] = useState(false);
  
  // Video State
  const [videoStatus, setVideoStatus] = useState<"idle" | "generating" | "success" | "error">("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [predictionId, setPredictionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Audio State
  const [audioStatus, setAudioStatus] = useState<"idle" | "generating" | "success" | "error">("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioPredictionId, setAudioPredictionId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Transformation State
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformedData, setTransformedData] = useState<any>(null);
  const [activeVideoPrompt, setActiveVideoPrompt] = useState(result.video_prompt);

  // Share State
  const [isPublic, setIsPublic] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const t = translations[language];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeVideoPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareToggle = async () => {
    if (!dreamId) return;
    setIsSharing(true);
    try {
      const res = await fetch("/api/dreams/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dreamId, isPublic: !isPublic }),
      });
      if (res.ok) setIsPublic(!isPublic);
    } catch (err) {
      console.error("Sharing failed");
    } finally {
      setIsSharing(false);
    }
  };

  const handleTransform = async () => {
    setIsTransforming(true);
    try {
      const res = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          dream: result.analysis, 
          core_fear: result.core_fear,
          language 
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTransformedData(data);
        setActiveVideoPrompt(data.new_video_prompt);
        setVideoStatus("idle");
        setVideoUrl(null);
      }
    } catch (err) {
      console.error("Transformation failed");
    } finally {
      setIsTransforming(false);
    }
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
        body: JSON.stringify({ video_prompt: activeVideoPrompt, dreamId }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start generation");
      setPredictionId(data.id);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred");
      setVideoStatus("error");
    }
  };

  const handleGenerateAudio = async () => {
    setAudioStatus("generating");
    setAudioUrl(null);
    try {
      const res = await fetch("/api/generate-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood_prompt: result.reframe, dreamId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Failed to start audio");
      setAudioPredictionId(data.id);
    } catch (err) {
      setAudioStatus("error");
    }
  };

  // Progress Bar Effect
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

  // Video Polling Effect
  useEffect(() => {
    if (!predictionId || videoStatus !== "generating") return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/generate-video?id=${predictionId}&dreamId=${dreamId || ""}`);
        const data = await res.json();
        if (data.status === "succeeded") {
          setVideoUrl(data.output);
          setVideoStatus("success");
          clearInterval(interval);
        } else if (data.status === "failed" || data.status === "canceled") {
          setVideoStatus("error");
          setErrorMessage(data.error || "Video generation failed on server");
          clearInterval(interval);
        }
      } catch (err) {
        setVideoStatus("error");
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [predictionId, videoStatus, dreamId]);

  // Audio Polling Effect
  useEffect(() => {
    if (!audioPredictionId || audioStatus !== "generating") return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/generate-audio?id=${audioPredictionId}`);
        const data = await res.json();
        if (data.status === "succeeded") {
          setAudioUrl(data.output);
          setAudioStatus("success");
          clearInterval(interval);
        } else if (data.status === "failed" || data.status === "canceled") {
          setAudioStatus("error");
          clearInterval(interval);
        }
      } catch (err) {
        setAudioStatus("error");
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [audioPredictionId, audioStatus]);

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
      window.open(videoUrl, '_blank');
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.1 }} className="w-full max-w-4xl mx-auto flex flex-col gap-6 px-1 sm:px-0">
      
      <AnimatePresence mode="wait">
        {!transformedData ? (
          <motion.div key="original" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-6">
            <motion.div variants={item} className="glass-card p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start gap-6 border-l-4 border-l-orange/50">
              <div className="flex-1">
                <h3 className="flex items-center gap-2 text-xl font-serif mb-4 text-orange">
                  <Heart className="w-5 h-5" /> {t.compassion}
                </h3>
                <p className="text-milk/90 leading-relaxed text-lg italic">&ldquo;{result.empathy}&rdquo;</p>
              </div>
              
              <div className="bg-navy-deep/50 p-4 rounded-2xl border border-white/5 min-w-[160px] flex flex-col items-center gap-3">
                {audioStatus === "idle" && (
                  <button onClick={handleGenerateAudio} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-milk/40 hover:text-orange transition-all duration-300">
                    <Music className="w-4 h-4" /> Soundscape
                  </button>
                )}
                {audioStatus === "generating" && (
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange">
                    <Loader2 className="w-4 h-4 animate-spin" /> Mixing...
                  </div>
                )}
                {audioStatus === "success" && audioUrl && (
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-10 h-10 rounded-full bg-orange flex items-center justify-center text-white shadow-orange-glow"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                    </button>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-milk/20 font-bold uppercase tracking-widest leading-none mb-1">Status</span>
                      <span className="text-xs text-orange font-bold uppercase tracking-wider leading-none">Active</span>
                    </div>
                    <audio src={audioUrl} onEnded={() => setIsPlaying(false)} ref={(el) => { if(el) isPlaying ? el.play() : el.pause() }} loop />
                  </div>
                )}
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div variants={item} className="glass-card glass-card-hover p-6 sm:p-8">
                <h3 className="flex items-center gap-2 text-lg font-serif mb-4 text-milk/60">
                  <Brain className="w-5 h-5 text-orange" /> {t.analysis}
                </h3>
                <p className="text-milk/80 leading-relaxed">{result.analysis}</p>
              </motion.div>
              <motion.div variants={item} className="glass-card glass-card-hover p-6 sm:p-8">
                <h3 className="flex items-center gap-2 text-lg font-serif mb-4 text-milk/60">
                  <Sparkles className="w-5 h-5 text-orange" /> {t.reframe}
                </h3>
                <p className="text-milk/80 leading-relaxed">{result.reframe}</p>
              </motion.div>
            </div>

            <motion.div variants={item} className="flex flex-wrap items-center justify-center gap-4 py-4">
              <button onClick={handleTransform} disabled={isTransforming} className="btn-primary flex items-center gap-3">
                {isTransforming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                <span>Transform nightman into Hero</span>
              </button>
              {dreamId && (
                <button onClick={handleShareToggle} disabled={isSharing} className={`px-8 py-3 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all duration-300 border flex items-center gap-3 active:scale-95 ${isPublic ? "bg-aurora/10 border-aurora/30 text-aurora" : "bg-white/5 border-white/10 text-milk/40 hover:text-milk hover:bg-white/10"}`}>
                  {isSharing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
                  <span>{isPublic ? "Shared" : "Share"}</span>
                </button>
              )}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div key="transformed" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 sm:p-8 border-2 border-orange/20 shadow-orange-glow">
            <div className="flex items-center justify-between mb-6">
              <h3 className="flex items-center gap-2 text-2xl font-serif text-orange">
                <ShieldCheck className="w-6 h-6" /> Positive Resolution
              </h3>
              <button onClick={() => { setTransformedData(null); setActiveVideoPrompt(result.video_prompt); setVideoStatus("idle"); setVideoUrl(null); }} className="text-xs font-bold uppercase tracking-widest text-milk/20 hover:text-orange transition-colors">Show Original</button>
            </div>
            <p className="text-milk leading-relaxed text-xl italic mb-6">&ldquo;{transformedData.transformed_story}&rdquo;</p>
            <div className="bg-navy-deep/50 p-6 rounded-2xl border border-orange/10">
              <p className="text-milk/60 leading-relaxed italic text-sm">
                <span className="font-bold text-orange uppercase tracking-widest text-[10px] block mb-1">Therapist Note</span>
                {transformedData.explanation}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Generation - Soft Theme Update */}
      <motion.div variants={item} className="glass-card p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
           <div>
            <h3 className="flex items-center gap-2 text-xl font-serif text-orange mb-2">
              <Video className="w-6 h-6" /> Visual Simulation
            </h3>
            <p className="text-milk/40 text-sm max-w-md">The AI visualizes your subconscious themes into a 3D animated sequence.</p>
          </div>
          
          {videoStatus === "idle" && (
            <button onClick={handleGenerateVideo} className="btn-primary flex items-center gap-3">
              <Video className="w-5 h-5" /> {t.generateVideo}
            </button>
          )}
        </div>

        <div className="bg-navy-deep/50 rounded-2xl p-4 border border-white/5 mb-6">
           <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-milk/20">Render Prompt</span>
              <button onClick={handleCopy} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-milk/40 hover:text-orange transition-all active:scale-90">
                {copied ? <Check className="w-4 h-4 text-orange" /> : <Copy className="w-4 h-4" />}
              </button>
           </div>
           <p className="text-milk/60 font-mono text-xs leading-relaxed break-words">{activeVideoPrompt}</p>
        </div>

        <AnimatePresence>
          {videoStatus === "generating" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 py-8">
              <div className="relative">
                <Loader2 className="w-12 h-12 animate-spin text-orange opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-4 h-4 rounded-full bg-orange shadow-orange-glow animate-ping" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-milk font-serif text-lg mb-2">{t.generatingVideo}</p>
                <div className="w-64 bg-white/5 rounded-full h-1 overflow-hidden">
                   <motion.div className="bg-orange h-full shadow-orange-glow" animate={{ width: `${progress}%` }} />
                </div>
              </div>
            </motion.div>
          )}

          {videoStatus === "success" && videoUrl && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-6">
              <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
                <video src={videoUrl} autoPlay loop playsInline controls className="w-full h-full object-cover" />
              </div>
              <div className="flex gap-4">
                <button onClick={handleDownload} className="px-6 py-2 rounded-xl bg-milk text-navy-deep font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                  <Download className="w-4 h-4" /> Save
                </button>
                <button onClick={() => window.open(videoUrl, '_blank')} className="px-6 py-2 rounded-xl border border-white/10 text-milk/40 font-bold text-xs uppercase tracking-widest hover:text-milk hover:border-white/20 transition-all flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" /> Fullscreen
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div variants={item} className="glass-card p-6 sm:p-8">
          <h3 className="flex items-center gap-2 text-lg font-serif mb-4 text-orange">
            <Wind className="w-5 h-5" /> {t.breathing}
          </h3>
          <p className="text-milk/70 leading-relaxed text-sm">{result.breathing_exercise}</p>
        </motion.div>
        <motion.div variants={item} className="glass-card p-6 sm:p-8">
          <h3 className="flex items-center gap-2 text-lg font-serif mb-4 text-orange">
            <Moon className="w-5 h-5" /> {t.sleepTechnique}
          </h3>
          <p className="text-milk/70 leading-relaxed text-sm">{result.sleep_technique}</p>
        </motion.div>
      </div>

      <motion.div variants={item} className="text-center py-12">
        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-milk/20 block mb-6">{t.affirmationLabel}</span>
        <p className="font-serif text-3xl md:text-5xl text-orange/80 italic leading-tight max-w-3xl mx-auto">&ldquo;{result.affirmation}&rdquo;</p>
      </motion.div>
    </motion.div>
  );
}
