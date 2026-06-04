"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { DreamAnalysisResponse } from "@/types/dream";

interface DreamFormProps {
  onAnalysisResult: (result: DreamAnalysisResponse) => void;
}

export default function DreamForm({ onAnalysisResult }: DreamFormProps) {
  const [dream, setDream] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        body: JSON.stringify({ dream }),
      });

      if (!res.ok) {
        throw new Error("Failed to analyze dream. Please try again.");
      }

      const data = await res.json();
      onAnalysisResult(data.result);
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
        <label htmlFor="dream" className="text-xl font-serif text-black">
          Describe your nightmare or dream
        </label>
        <textarea
          id="dream"
          rows={6}
          className="w-full p-4 rounded-xl border border-black/10 focus:border-orange focus:ring-2 focus:ring-orange/20 outline-none transition-all resize-none bg-white font-sans text-black shadow-sm"
          placeholder="I was running through a dark forest..."
          value={dream}
          onChange={(e) => setDream(e.target.value)}
          disabled={loading}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading || !dream.trim()}
          className="bg-black hover:bg-black/90 disabled:bg-black/50 text-white font-medium py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg w-full sm:w-auto self-end"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze Dream"
          )}
        </button>
      </form>
    </motion.div>
  );
}
