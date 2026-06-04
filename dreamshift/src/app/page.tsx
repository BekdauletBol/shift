"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoonStar } from "lucide-react";
import DreamForm from "@/components/DreamForm";
import DreamResult from "@/components/DreamResult";
import { DreamAnalysisResponse } from "@/types/dream";

export default function Home() {
  const [result, setResult] = useState<DreamAnalysisResponse | null>(null);

  return (
    <main className="flex flex-col items-center min-h-screen p-6 sm:p-12 md:p-24 bg-cream text-black selection:bg-orange selection:text-white">
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-12">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center flex flex-col items-center gap-4"
        >
          <div className="bg-orange text-white p-3 rounded-2xl shadow-lg mb-4">
            <MoonStar className="w-10 h-10" />
          </div>
          <h1 className="text-5xl md:text-7xl font-serif tracking-tight text-black">
            DreamShift
          </h1>
          <p className="text-lg md:text-xl text-black/70 max-w-2xl font-sans mt-2">
            Reframe your nightmares. Understand your core fears. Sleep better tonight.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <DreamForm onAnalysisResult={setResult} />
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full flex flex-col gap-8"
            >
              <button 
                onClick={() => setResult(null)}
                className="text-black/50 hover:text-orange self-start transition-colors font-medium font-sans flex items-center gap-2 group"
              >
                ← <span className="group-hover:underline">Analyze another dream</span>
              </button>
              <DreamResult result={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
