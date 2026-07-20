"use client";

import { useState } from "react";
import { X, MessageSquare, Send, CheckCircle2, Plus, Newspaper, RefreshCw, ExternalLink, Calendar } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { collection, addDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

export function FeedbackSidebar() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("suggestion");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // News drawer states
  const [isNewsOpen, setIsNewsOpen] = useState(false);
  const [news, setNews] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);

  const fetchNews = async () => {
    setLoadingNews(true);
    try {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error("Failed to fetch news");
      const data = await res.json();
      setNews(data);
    } catch (err) {
      console.error("Error loading news:", err);
      toast.error("Failed to load news feed.");
    } finally {
      setLoadingNews(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please enter your feedback message.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "feedbacks"), {
        name: name.trim() || "Anonymous User",
        email: email.trim() || "No Email Provided",
        category,
        message: message.trim(),
        created_at: new Date().toISOString(),
      });

      setSubmitted(true);
      toast.success("Feedback submitted! Thank you.");
      
      // Reset form fields
      setName("");
      setEmail("");
      setCategory("suggestion");
      setMessage("");
      
      // Auto close after 2 seconds
      setTimeout(() => {
        setSubmitted(false);
        setIsOpen(false);
      }, 2000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── FLOATING SIDEBAR ACTIONS TOOLBAR (Prevents Overlap) ── */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2.5 items-end">
        {/* Register Section Button */}
        <button
          onClick={() => {
            if (user) {
              router.push("/sell");
            } else {
              router.push("/auth/login?redirectTo=/sell");
            }
          }}
          className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 hover:from-green-700 hover:to-emerald-700 dark:hover:from-green-600 dark:hover:to-emerald-600 text-white font-black py-4 px-2 rounded-l-2xl shadow-2xl flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-300 hover:pr-3 group select-none border-l border-y border-green-500/30"
          style={{ writingMode: "vertical-lr" }}
        >
          <span className="flex items-center gap-1.5 text-xs tracking-widest uppercase">
            <Plus className="size-3.5 rotate-90" /> Register Section
          </span>
        </button>

        {/* Feedback Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-black py-4 px-2 rounded-l-2xl shadow-2xl flex flex-col items-center gap-1 cursor-pointer transition-all duration-300 hover:pr-3 group select-none border-l border-y border-emerald-500/30"
          style={{ writingMode: "vertical-lr" }}
        >
          <span className="flex items-center gap-1.5 text-xs tracking-widest uppercase">
            <MessageSquare className="size-3.5 rotate-90" /> Feedback
          </span>
        </button>

        {/* Real Estate News Button */}
        <button
          onClick={() => {
            setIsNewsOpen(true);
            if (news.length === 0) fetchNews();
          }}
          className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-black py-4 px-2 rounded-l-2xl shadow-2xl flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-300 hover:pr-3 group select-none border-l border-y border-blue-500/30"
          style={{ writingMode: "vertical-lr" }}
        >
          <span className="flex items-center gap-1.5 text-xs tracking-widest uppercase">
            <Newspaper className="size-3.5 rotate-90" /> Daily News
          </span>
        </button>
      </div>

      {/* ── OVERLAY BACKDROP ── */}
      {(isOpen || isNewsOpen) && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => {
            setIsOpen(false);
            setIsNewsOpen(false);
          }}
        />
      )}

      {/* ── DRAWER CONTENT PANEL ── */}
      <div
        className={`fixed top-0 right-0 h-full w-[380px] max-w-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <MessageSquare className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Give Feedback</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Help us make BhoomiTayi better</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Form Container */}
        <div className="flex-1 overflow-y-auto p-6">
          {submitted ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
              <div className="p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full animate-bounce">
                <CheckCircle2 className="size-12" />
              </div>
              <h4 className="font-bold text-lg">Thank You!</h4>
              <p className="text-sm text-zinc-500 max-w-[280px]">
                Your feedback has been logged. We use your suggestions to constantly improve BhoomiTayi!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "suggestion", label: "Idea" },
                    { id: "bug", label: "Bug" },
                    { id: "other", label: "Other" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`h-10 rounded-xl text-xs font-bold border transition-all ${
                        category === cat.id
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Your Message
                </label>
                <textarea
                  rows={6}
                  placeholder="What can we improve? Please be as detailed as possible."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="w-full p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-500 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 transition-transform active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="size-4" /> Submit Feedback
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ── NEWS DRAWER PANEL (w-full md:w-[50vw]) ── */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[50vw] bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out transform ${
          isNewsOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <Newspaper className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Real Estate & Finance News</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Stay updated with Indian property, stocks, and investments</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchNews}
              disabled={loadingNews}
              title="Refresh news"
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`size-4 ${loadingNews ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setIsNewsOpen(false)}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Scrollable news content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loadingNews ? (
            <div className="space-y-4 py-8">
              {[...Array(6)].map((_, idx) => (
                <div key={idx} className="animate-pulse space-y-2 p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : news.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-12">
              <div className="p-4 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full">
                <Newspaper className="size-8" />
              </div>
              <h4 className="font-bold text-base">No news feeds loaded</h4>
              <button 
                onClick={fetchNews}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all animate-pulse"
              >
                Load Daily Feeds
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {news.map((item: any, idx: number) => {
                const dateStr = item.pubDate ? new Date(item.pubDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit"
                }) : "";
                
                return (
                  <a
                    key={idx}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/30 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                        {item.source}
                      </span>
                      <ExternalLink className="size-3.5 text-zinc-400 group-hover:text-blue-500 transition-colors shrink-0" />
                    </div>
                    <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                      {item.title}
                    </h4>
                    {dateStr && (
                      <div className="flex items-center gap-1 mt-3 text-[11px] text-zinc-400">
                        <Calendar className="size-3" />
                        <span>{dateStr}</span>
                      </div>
                    )}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
