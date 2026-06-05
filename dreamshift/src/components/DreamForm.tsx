"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2, Globe, Mic, MicOff, Sparkles } from "lucide-react";
import { DreamAnalysisResponse, Language } from "@/types/dream";
import { translations } from "@/lib/translations";

interface DreamFormProps {
  onAnalysisResult: (result: DreamAnalysisResponse, dreamId: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

export default function DreamForm({ onAnalysisResult, language, setLanguage }: DreamFormProps) {
  const [dream, setDream] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const t = translations[language];

  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        }
        if (finalTranscript) setDream(prev => prev + (prev ? " " : "") + finalTranscript);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === "en" ? "en-US" : language === "ru" ? "ru-RU" : "kk-KZ";
    }
  }, [language]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dream.trim()) return;
    if (isListening) recognitionRef.current?.stop();

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dream, language }),
      });
      if (!res.ok) throw new Error(t.error);
      const data = await res.json();
      onAnalysisResult(data.result, data._id);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-3xl mx-auto glass-card p-6 sm:p-8"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-orange/10 flex items-center justify-center border border-orange/20">
                <Sparkles className="w-4 h-4 text-orange" />
              </div>
              <label htmlFor="dream" className="text-xl font-serif text-milk font-medium">
                {t.label}
              </label>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleListening}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 ${
                isListening 
                  ? "bg-orange/20 border-orange text-orange animate-pulse" 
                  : "bg-white/5 border-white/10 text-milk/40 hover:text-milk hover:bg-white/10"
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span className="text-xs font-bold uppercase tracking-wider">{isListening ? "Listening" : "Voice"}</span>
            </button>
            
            <div className="flex items-center gap-2 bg-navy-light/50 border border-white/10 rounded-xl px-4 py-2">
              <Globe className="w-4 h-4 text-milk/40" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-transparent text-xs font-bold uppercase tracking-wider outline-none cursor-pointer text-milk/80"
                disabled={loading}
              >
                <option value="en" className="bg-navy-deep">English</option>
                <option value="ru" className="bg-navy-deep">Russian</option>
                <option value="kk" className="bg-navy-deep">Kazakh</option>
              </select>
            </div>
          </div>
        </div>

        <textarea
          id="dream"
          rows={6}
          className="input-field min-h-[200px] resize-none text-lg leading-relaxed"
          placeholder={t.placeholder}
          value={dream}
          onChange={(e) => setDream(e.target.value)}
          disabled={loading}
        />

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm font-medium text-center">
            {error}
          </motion.p>
        )}

        <button
          type="submit"
          disabled={loading || !dream.trim()}
          className="btn-primary self-end flex items-center gap-3 w-full sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{t.analyzing}</span>
            </>
          ) : (
            <>
              <span>{t.button}</span>
              <Sparkles className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
