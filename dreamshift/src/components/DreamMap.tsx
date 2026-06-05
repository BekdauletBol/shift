"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Compass, Maximize2, Info } from "lucide-react";
import { DreamDocument } from "@/types/dream";

export default function DreamMap() {
  const [dreams, setDreams] = useState<DreamDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredDream, setHoveredDream] = useState<DreamDocument | null>(null);

  useEffect(() => {
    const fetchDreams = async () => {
      try {
        const res = await fetch("/api/dreams");
        const data = await res.json();
        if (Array.isArray(data)) setDreams(data.filter(d => d.result.map_coords));
      } catch (err) {
        console.error("Failed to fetch dreams for map");
      } finally {
        setLoading(false);
      }
    };
    fetchDreams();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-orange" />
        <p className="text-milk/40">Mapping your subconscious landscape...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      <div className="relative aspect-square sm:aspect-video bg-navy/50 rounded-3xl border border-milk/10 overflow-hidden shadow-2xl">
        {/* Grid Lines */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-px h-full bg-milk/5" />
          <div className="h-px w-full bg-milk/5" />
        </div>

        {/* Axis Labels */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest text-milk/20 font-bold">High Intensity</div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest text-milk/20 font-bold">Low Intensity</div>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] uppercase tracking-widest text-milk/20 font-bold">Realistic</div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-[10px] uppercase tracking-widest text-milk/20 font-bold">Lucid / Surreal</div>

        {/* Dream Points */}
        {dreams.map((dream, index) => {
          const x = dream.result.map_coords?.lucidity || 50;
          const y = 100 - (dream.result.map_coords?.intensity || 50); // Invert y for "High" at top

          return (
            <motion.button
              key={dream._id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05, type: "spring" }}
              onMouseEnter={() => setHoveredDream(dream)}
              onMouseLeave={() => setHoveredDream(null)}
              className="absolute w-4 h-4 rounded-full bg-orange shadow-[0_0_15px_rgba(255,107,53,0.5)] border-2 border-white/20 transition-transform hover:scale-150 z-10"
              style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
            />
          );
        })}

        {/* Hover Info Panel */}
        <AnimatePresence>
          {hoveredDream && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-8 left-8 right-8 bg-navy/90 backdrop-blur-md border border-orange/30 p-4 rounded-2xl shadow-2xl z-20 pointer-events-none"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-orange font-bold text-xs uppercase tracking-tighter">
                  {new Date(hoveredDream.createdAt).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  <span className="text-[10px] bg-milk/10 px-2 py-0.5 rounded text-milk/60">L: {hoveredDream.result.map_coords?.lucidity}</span>
                  <span className="text-[10px] bg-milk/10 px-2 py-0.5 rounded text-milk/60">I: {hoveredDream.result.map_coords?.intensity}</span>
                </div>
              </div>
              <p className="text-milk text-sm italic line-clamp-2">
                &ldquo;{hoveredDream.dream}&rdquo;
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {dreams.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-milk/20 text-center px-12">
            <p>New dreams will appear on this map as you analyze them.</p>
          </div>
        )}
      </div>

      <div className="bg-white/5 p-4 rounded-2xl border border-milk/10 flex items-center gap-3">
        <Info className="w-5 h-5 text-orange shrink-0" />
        <p className="text-xs text-milk/40 leading-relaxed">
          The <strong>Dream Map</strong> visualizes your emotional landscape. Dreams on the right are more lucid or surreal, while those at the top carry higher emotional intensity.
        </p>
      </div>
    </div>
  );
}
