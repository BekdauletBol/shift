"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Share2, MessageCircle, Heart } from "lucide-react";
import { DreamDocument } from "@/types/dream";

export default function DreamWall() {
  const [dreams, setDreams] = useState<DreamDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicDreams = async () => {
      try {
        const res = await fetch("/api/dreams/public");
        const data = await res.json();
        if (Array.isArray(data)) setDreams(data);
      } catch (err) {
        console.error("Failed to fetch public dreams");
      } finally {
        setLoading(false);
      }
    };
    fetchPublicDreams();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-orange" />
        <p className="text-milk/40">Entering the collective unconscious...</p>
      </div>
    );
  }

  if (dreams.length === 0) {
    return (
      <div className="text-center py-20 bg-milk/5 rounded-3xl border border-milk/10 max-w-2xl mx-auto px-8">
        <Share2 className="w-10 h-10 text-orange/30 mx-auto mb-4" />
        <p className="text-milk/60 leading-relaxed">The Dream Wall is quiet. Be the first to share your journey!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
      {dreams.map((dream, index) => (
        <motion.div
          key={dream._id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white/5 rounded-3xl border border-milk/10 overflow-hidden flex flex-col group"
        >
          <div className="aspect-video bg-black/40 relative">
            {dream.video_url ? (
              <video 
                src={dream.video_url} 
                className="w-full h-full object-cover"
                autoPlay 
                loop 
                muted 
                playsInline
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-milk/20 italic">
                Video processing...
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          </div>

          <div className="p-6 flex flex-col flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-orange/20 flex items-center justify-center border border-orange/30">
                <Heart className="w-4 h-4 text-orange" />
              </div>
              <span className="text-xs font-medium text-milk/40">Anonymous Dreamer</span>
            </div>
            
            <p className="text-milk/80 text-sm italic leading-relaxed line-clamp-3 mb-4 flex-1">
              &ldquo;{dream.dream}&rdquo;
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-milk/10 mt-auto">
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1.5 text-milk/40 hover:text-orange transition-colors">
                  <Heart className="w-4 h-4" />
                  <span className="text-xs">12</span>
                </button>
                <button className="flex items-center gap-1.5 text-milk/40 hover:text-milk transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs">4</span>
                </button>
              </div>
              <span className="text-[10px] text-milk/20 uppercase tracking-widest font-bold">
                {new Date(dream.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
