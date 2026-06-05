"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoonStar } from "lucide-react";
import DreamForm from "@/components/DreamForm";
import DreamResult from "@/components/DreamResult";
import { DreamAnalysisResponse, Language } from "@/types/dream";
import { translations } from "@/lib/translations";

export default function Home() {
  const [result, setResult] = useState<DreamAnalysisResponse | null>(null);
  const [dreamId, setDreamId] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>("en");

  const t = translations[language];

  return (
    <main className="flex flex-col items-center min-h-screen px-4 py-8 sm:p-12 md:p-24 bg-navy text-milk selection:bg-orange selection:text-white">
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-8 sm:gap-12">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center flex flex-col items-center gap-3 sm:gap-4"
        >
          <div className="bg-orange text-white p-3 rounded-2xl shadow-lg mb-2 sm:mb-4">
            <MoonStar className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif tracking-tight text-milk leading-tight">
            {t.title}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-milk/70 max-w-2xl font-sans mt-1 sm:mt-2 px-2">
            {t.subtitle}
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
              <DreamForm 
                language={language} 
                setLanguage={setLanguage}
                onAnalysisResult={(res, id) => {
                  setResult(res);
                  setDreamId(id);
                }} 
              />
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full flex flex-col gap-8"
            >
              <button 
                onClick={() => {
                  setResult(null);
                  setDreamId(null);
                }}
                className="text-milk/50 hover:text-orange self-start transition-colors font-medium font-sans flex items-center gap-2 group"
              >
                ← <span className="group-hover:underline">{t.another}</span>
              </button>
              <DreamResult result={result} dreamId={dreamId} language={language} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
