"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Mail, Lock, User as UserIcon } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const body = isLogin ? { email, password } : { name, email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      onSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-navy/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-navy border border-milk/10 rounded-2xl shadow-2xl p-8 overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-milk/40 hover:text-milk transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-serif text-milk mb-2">
                {isLogin ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="text-milk/60">
                {isLogin
                  ? "Sign in to save your dreams"
                  : "Start your dream journal today"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {!isLogin && (
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-milk/30" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-navy/50 border border-milk/10 rounded-xl py-3 pl-10 pr-4 text-milk placeholder:text-milk/30 focus:border-orange focus:ring-1 focus:ring-orange/20 outline-none transition-all"
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-milk/30" />
                <input
                  type="email"
                  placeholder="Email Address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-navy/50 border border-milk/10 rounded-xl py-3 pl-10 pr-4 text-milk placeholder:text-milk/30 focus:border-orange focus:ring-1 focus:ring-orange/20 outline-none transition-all"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-milk/30" />
                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-navy/50 border border-milk/10 rounded-xl py-3 pl-10 pr-4 text-milk placeholder:text-milk/30 focus:border-orange focus:ring-1 focus:ring-orange/20 outline-none transition-all"
                />
              </div>

              {error && <p className="text-red-400 text-sm text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange hover:bg-orange/90 disabled:bg-orange/50 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg mt-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isLogin ? "Sign In" : "Create Account"}
              </button>
            </form>

            <div className="mt-6 text-center text-milk/40 text-sm">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-orange hover:underline font-medium"
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
