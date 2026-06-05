"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Sparkles, Target, Brain, Quote } from "lucide-react";

export default function DreamInsights() {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await fetch("/api/insights");
        const data = await res.json();
        if (res.ok) {
          setInsights(data);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError("Failed to load insights");
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-orange" />
        <p className="text-milk/40 font-medium">Analyzing your dream patterns...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 bg-milk/5 rounded-3xl border border-milk/10 max-w-2xl mx-auto px-8">
        <Sparkles className="w-10 h-10 text-orange/30 mx-auto mb-4" />
        <p className="text-milk/60 leading-relaxed">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-orange/10 p-6 sm:p-8 rounded-3xl border border-orange/20"
      >
        <h3 className="flex items-center gap-2 text-xl font-serif text-milk mb-4">
          <Brain className="w-6 h-6 text-orange" /> Pattern Summary
        </h3>
        <p className="text-milk/80 leading-relaxed text-lg italic">
          &ldquo;{insights.summary}&rdquo;
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/5 p-6 rounded-3xl border border-milk/10"
        >
          <h3 className="flex items-center gap-2 text-lg font-serif text-milk mb-4">
            <Target className="w-5 h-5 text-orange" /> Recurring Symbols
          </h3>
          <div className="flex flex-col gap-4">
            {insights.symbols.map((symbol: any, i: number) => (
              <div key={i} className="bg-navy/50 p-4 rounded-xl border border-milk/5">
                <span className="font-bold text-orange block mb-1">{symbol.name}</span>
                <p className="text-sm text-milk/60 leading-tight">{symbol.meaning}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/5 p-6 rounded-3xl border border-milk/10"
        >
          <h3 className="flex items-center gap-2 text-lg font-serif text-milk mb-4">
            <Sparkles className="w-5 h-5 text-orange" /> Persistent Themes
          </h3>
          <div className="flex flex-wrap gap-2">
            {insights.themes.map((theme: string, i: number) => (
              <span
                key={i}
                className="bg-milk/10 text-milk/80 px-4 py-2 rounded-full text-sm font-medium border border-milk/10"
              >
                {theme}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
