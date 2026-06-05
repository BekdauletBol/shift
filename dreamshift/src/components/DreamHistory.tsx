"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Calendar, ChevronRight, Video, Sparkles } from "lucide-react";
import { DreamDocument } from "@/types/dream";

interface DreamHistoryProps {
  onSelect: (dream: DreamDocument) => void;
}

export default function DreamHistory({ onSelect }: DreamHistoryProps) {
  const [dreams, setDreams] = useState<DreamDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDreams = async () => {
      try {
        const res = await fetch("/api/dreams");
        const data = await res.json();
        if (Array.isArray(data)) setDreams(data);
      } catch (err) {
        console.error("Failed to fetch dreams");
      } finally {
        setLoading(false);
      }
    };
    fetchDreams();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="relative">
           <Loader2 className="w-12 h-12 animate-spin text-orange opacity-20" />
           <Sparkles className="absolute inset-0 m-auto w-4 h-4 text-orange animate-pulse" />
        </div>
        <p className="text-milk/20 font-bold uppercase tracking-[0.2em] text-[10px]">Retrieving Memory</p>
      </div>
    );
  }

  if (dreams.length === 0) {
    return (
      <div className="text-center py-32 glass-card max-w-2xl mx-auto px-8 border-dashed">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
           <Calendar className="w-6 h-6 text-milk/20" />
        </div>
        <h3 className="text-xl font-serif text-milk/60 mb-2">Your Journal is Empty</h3>
        <p className="text-milk/30 text-sm italic">Every dream is a piece of the puzzle. Start by analyzing your first one.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 w-full max-w-4xl mx-auto">
      {dreams.map((dream, index) => (
        <motion.button
          key={dream._id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelect(dream)}
          className="flex items-center gap-6 p-6 glass-card glass-card-hover text-left group relative overflow-hidden"
        >
          {/* Subtle Progress Indicator */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange/0 group-hover:bg-orange transition-all duration-500" />
          
          <div className="w-12 h-12 rounded-2xl bg-navy-deep/50 flex items-center justify-center border border-white/5 group-hover:border-orange/20 transition-colors">
             <span className="text-orange font-serif text-lg font-bold">{index + 1}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 text-milk/30 text-[10px] font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-md">
                 <Calendar className="w-3 h-3" />
                 {new Date(dream.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              {dream.video_url && (
                <span className="flex items-center gap-1 text-orange/60">
                   <Video className="w-3 h-3" /> Video Ready
                </span>
              )}
            </div>
            <p className="text-milk/80 font-medium truncate italic text-lg pr-4">
              &ldquo;{dream.dream}&rdquo;
            </p>
          </div>
          
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/0 group-hover:bg-orange/10 transition-all border border-white/0 group-hover:border-orange/20">
             <ChevronRight className="w-5 h-5 text-milk/10 group-hover:text-orange transition-colors" />
          </div>
        </motion.button>
      ))}
    </div>
  );
}
