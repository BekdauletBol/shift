"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoonStar, User as UserIcon, LogOut, History, Sparkles, Users, Compass, LayoutDashboard } from "lucide-react";
import DreamForm from "@/components/DreamForm";
import DreamResult from "@/components/DreamResult";
import AuthModal from "@/components/AuthModal";
import DreamHistory from "@/components/DreamHistory";
import DreamInsights from "@/components/DreamInsights";
import DreamWall from "@/components/DreamWall";
import DreamMap from "@/components/DreamMap";
import { DreamAnalysisResponse, Language, DreamDocument } from "@/types/dream";
import { translations } from "@/lib/translations";

export default function Home() {
  const [result, setResult] = useState<DreamAnalysisResponse | null>(null);
  const [dreamId, setDreamId] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>("en");
  const [user, setUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [view, setView] = useState<"analyze" | "history" | "insights" | "community" | "map">("analyze");

  const t = translations[language];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.user) setUser(data.user);
      } catch (err) {
        console.error("Failed to fetch user");
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setView("analyze");
  };

  return (
    <main className="flex flex-col items-center min-h-screen px-4 py-6 sm:p-12 md:p-16">
      {/* Premium Header */}
      <header className="w-full max-w-6xl mx-auto flex justify-between items-center mb-16 px-4 py-4 glass-card border-none bg-white/0 shadow-none">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setView("analyze")}>
          <div className="w-10 h-10 rounded-2xl bg-orange flex items-center justify-center shadow-orange-glow group-hover:scale-110 transition-transform duration-300">
            <MoonStar className="w-6 h-6 text-white" />
          </div>
          <span className="font-serif text-2xl tracking-tighter font-bold text-gradient">DreamShift</span>
        </div>
        
        <div className="flex items-center gap-4">
          <nav className="hidden lg:flex items-center gap-1 glass-card p-1">
            {[
              { id: "analyze", label: "Analyze", icon: Sparkles },
              { id: "community", label: "Community", icon: Users },
              { id: "history", label: "Journal", icon: History, auth: true },
              { id: "map", label: "Map", icon: Compass, auth: true },
              { id: "insights", label: "Insights", icon: LayoutDashboard, auth: true },
            ].map((item) => {
              if (item.auth && !user) return null;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => { setView(item.id as any); setResult(null); }}
                  className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all duration-300 ${view === item.id ? "bg-orange text-white shadow-orange-glow" : "text-milk/40 hover:text-milk hover:bg-white/5"}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 pl-4 pr-2 py-1.5 glass-card border-white/5 bg-navy-light/30">
                <span className="text-xs font-bold text-milk/80 hidden sm:inline">{user.name.split(' ')[0]}</span>
                <div className="w-8 h-8 rounded-full bg-orange/20 flex items-center justify-center border border-orange/30">
                  <UserIcon className="w-4 h-4 text-orange" />
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-3 text-milk/20 hover:text-red-400 transition-colors duration-300"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="btn-primary py-2.5 px-6 text-sm"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Mobile Nav Overhaul */}
      <div className="lg:hidden flex flex-wrap items-center justify-center gap-2 mb-12 glass-card p-1.5 w-full max-w-2xl border-white/5">
        {[
          { id: "analyze", label: "Analyze" },
          { id: "community", label: "Wall" },
          { id: "history", label: "Journal", auth: true },
          { id: "map", label: "Map", auth: true },
          { id: "insights", label: "Patterns", auth: true },
        ].map((item) => {
          if (item.auth && !user) return null;
          return (
            <button
              key={item.id}
              onClick={() => { setView(item.id as any); setResult(null); }}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${view === item.id ? "bg-orange text-white shadow-orange-glow" : "text-milk/30 hover:text-milk"}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
        {view === "analyze" && !result && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center flex flex-col items-center gap-6 mb-12"
          >
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-serif tracking-tighter text-gradient leading-[0.9] font-bold">
              {t.title}
            </h1>
            <p className="text-lg sm:text-xl text-milk/40 max-w-xl font-sans font-medium">
              {t.subtitle}
            </p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={view + (result ? "-result" : "")}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="w-full"
          >
            {view === "community" ? (
              <div className="w-full">
                <h2 className="text-4xl font-serif text-center mb-12 text-gradient">Collective Unconscious</h2>
                <DreamWall />
              </div>
            ) : view === "history" ? (
              <div className="w-full">
                <h2 className="text-4xl font-serif text-center mb-12 text-gradient">Dream Journal</h2>
                <DreamHistory 
                  onSelect={(dream: DreamDocument) => {
                    setResult(dream.result);
                    setDreamId(dream._id || null);
                    setLanguage(dream.language);
                    setView("analyze");
                  }} 
                />
              </div>
            ) : view === "map" ? (
              <div className="w-full">
                <h2 className="text-4xl font-serif text-center mb-12 text-gradient">Emotional Landscape</h2>
                <DreamMap />
              </div>
            ) : view === "insights" ? (
              <div className="w-full">
                <h2 className="text-4xl font-serif text-center mb-12 text-gradient">Growth Patterns</h2>
                <DreamInsights />
              </div>
            ) : !result ? (
              <DreamForm 
                language={language} 
                setLanguage={setLanguage}
                onAnalysisResult={(res, id) => {
                  setResult(res);
                  setDreamId(id);
                }} 
              />
            ) : (
              <div className="w-full flex flex-col gap-8">
                <button 
                  onClick={() => { setResult(null); setDreamId(null); }}
                  className="group flex items-center gap-3 text-milk/30 hover:text-orange transition-all duration-300 self-start font-bold uppercase tracking-widest text-[10px]"
                >
                  <div className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center group-hover:border-orange/50">←</div>
                  {t.another}
                </button>
                <DreamResult result={result} dreamId={dreamId} language={language} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={(u) => setUser(u)}
      />

      <footer className="mt-24 py-12 border-t border-white/5 w-full max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6 text-[10px] font-bold uppercase tracking-[0.3em] text-milk/10">
         <p>© 2026 DreamShift AI Labs</p>
         <div className="flex gap-8">
            <a href="#" className="hover:text-milk transition-colors">Privacy</a>
            <a href="#" className="hover:text-milk transition-colors">Methodology</a>
            <a href="#" className="hover:text-milk transition-colors">Open Source</a>
         </div>
      </footer>
    </main>
  );
}
