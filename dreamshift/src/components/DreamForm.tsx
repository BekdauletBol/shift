"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Globe } from "lucide-react";
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

  const t = translations[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dream.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dream, language }),
      });

      if (!res.ok) {
        throw new Error(t.error);
      }

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <label htmlFor="dream" className="text-xl font-serif text-milk">
            {t.label}
          </label>
          <div className="flex items-center gap-2 bg-navy/50 border border-milk/10 rounded-lg px-3 py-1.5 shadow-sm">
            <Globe className="w-4 h-4 text-milk/40" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent text-sm font-medium outline-none cursor-pointer text-milk"
              disabled={loading}
            >
              <option value="en" className="bg-navy text-milk">English</option>
              <option value="ru" className="bg-navy text-milk">Русский</option>
              <option value="kk" className="bg-navy text-milk">Қазақша</option>
            </select>
          </div>
        </div>
        <textarea
          id="dream"
          rows={6}
          className="w-full text-base sm:text-lg p-4 rounded-xl border border-milk/10 focus:border-orange focus:ring-2 focus:ring-orange/20 outline-none transition-all resize-none bg-navy/30 font-sans text-milk placeholder:text-milk/30 shadow-sm"
          placeholder={t.placeholder}
          value={dream}
          onChange={(e) => setDream(e.target.value)}
          disabled={loading}
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading || !dream.trim()}
          className="bg-orange hover:bg-orange/90 disabled:bg-orange/50 text-white font-medium py-4 sm:py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg w-full sm:w-auto self-end text-lg sm:text-base active:scale-95"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t.analyzing}
            </>
          ) : (
            t.button
          )}
        </button>
      </form>
    </motion.div>
  );
}
