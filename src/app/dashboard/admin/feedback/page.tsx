"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { Trash2, MessageSquare, ShieldAlert, Sparkles, User, Mail, Calendar, Search, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Feedback {
  id: string;
  name: string;
  email: string;
  category: string;
  message: string;
  created_at: string;
}

export default function FeedbackControlPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    const q = query(collection(db, "feedbacks"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Feedback[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Feedback);
      });
      // Sort in-memory
      list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setFeedbacks(list);
      setLoading(false);
    }, (error) => {
      console.error("Error loading feedbacks:", error);
      toast.error("Failed to load feedback logs.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this feedback log?")) return;
    try {
      await deleteDoc(doc(db, "feedbacks", id));
      toast.success("Feedback log deleted successfully!");
    } catch (error) {
      console.error("Error deleting feedback:", error);
      toast.error("Failed to delete feedback.");
    }
  };

  const filteredFeedbacks = feedbacks.filter((f) => {
    const matchesSearch = 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || f.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const bugCount = feedbacks.filter((f) => f.category === "bug").length;
  const ideaCount = feedbacks.filter((f) => f.category === "suggestion").length;
  const otherCount = feedbacks.filter((f) => f.category === "other").length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            User Feedback Manager
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Review suggestions, ideas, and bug reports sent by BhoomiTayi visitors.
          </p>
        </div>
      </div>

      {/* Analytics Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-[1.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <MessageSquare className="size-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Feedbacks</p>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-1">{feedbacks.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl">
              <ShieldAlert className="size-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Bug Reports</p>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-1">{bugCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-2xl">
              <Sparkles className="size-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Ideas/Suggestions</p>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-1">{ideaCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-zinc-500/10 text-zinc-650 dark:text-zinc-400 rounded-2xl">
              <MessageSquare className="size-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Others</p>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-1">{otherCount}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-zinc-50 dark:bg-zinc-900/30 p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-850">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search feedback content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 h-11 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: "all", label: "All Types" },
            { id: "suggestion", label: "Ideas" },
            { id: "bug", label: "Bugs" },
            { id: "other", label: "Other" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 h-10 rounded-xl text-xs font-black tracking-wide uppercase transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? "bg-zinc-900 text-white dark:bg-zinc-150 dark:text-zinc-900 shadow-sm"
                  : "bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback Logs List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <span className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-550 text-sm">Loading user feedback records...</p>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/10">
          <MessageSquare className="size-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
          <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-250">No Feedback Found</h3>
          <p className="text-sm text-zinc-500 mt-1 max-w-md mx-auto px-4">
            {searchQuery || selectedCategory !== "all" 
              ? "We couldn't find any feedbacks matching your search filters. Try widening your criteria."
              : "No feedback submissions have been registered yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredFeedbacks.map((f) => (
            <Card 
              key={f.id} 
              className="rounded-3xl border border-zinc-200 dark:border-zinc-850 shadow-sm bg-white dark:bg-zinc-900 overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                {/* Header card: name, email, category badge */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="size-4 text-zinc-400 shrink-0" />
                      <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">{f.name}</h4>
                    </div>
                    {f.email && f.email !== "No Email Provided" && (
                      <div className="flex items-center gap-2">
                        <Mail className="size-3.5 text-zinc-400 shrink-0" />
                        <a href={`mailto:${f.email}`} className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[200px]">
                          {f.email}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shrink-0 ${
                    f.category === "bug" 
                      ? "bg-red-500/10 text-red-600 dark:text-red-400" 
                      : f.category === "suggestion"
                      ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                      : "bg-zinc-500/10 text-zinc-650 dark:text-zinc-400"
                  }`}>
                    {f.category}
                  </span>
                </div>

                {/* Message Body */}
                <div className="bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-900/50">
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium whitespace-pre-wrap">
                    {f.message}
                  </p>
                </div>
              </div>

              {/* Footer action area */}
              <div className="px-6 py-4 bg-zinc-50/50 dark:bg-zinc-900/30 border-t border-zinc-100 dark:border-zinc-850 flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-semibold">
                  <Calendar className="size-3.5 shrink-0" />
                  <span>{new Date(f.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}</span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(f.id)}
                  className="h-8 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 px-2.5 font-bold"
                >
                  <Trash2 className="size-4 mr-1.5" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
