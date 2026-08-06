"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import IdeaCard from "@/components/IdeaCard";
import ReelsFeed from "@/components/ReelsFeed";

export default function CommunityPage() {
  const [ideas, setIdeas] = useState([]);
  const [showReels, setShowReels] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, "sharedIdeas"),
      where("visibility", "==", "public"),
      orderBy("sharedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const sharedIdeas = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setIdeas(sharedIdeas);
        setError(null);
      },
      (err) => {
        console.error("Community feed snapshot error:", err);
        setError(err.message || "Failed to load community feed. Check Firestore rules and project config.");
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-transparent text-slate-900 pb-10">
      <main className="container-max pt-6">
        <div className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Community feed</p>
            <h1 className="text-3xl font-semibold">Other people&apos;s ideas</h1>
            <p className="mt-2 text-slate-400">Browse public ideas shared around the community.</p>
          </div>
          <div className="mt-3 flex gap-3">
            <button
              className={`rounded-full px-4 py-2 text-sm font-medium ${showReels ? "bg-white border border-gray-200" : "bg-transparent text-slate-700"}`}
              onClick={() => setShowReels(true)}
            >
              Reels
            </button>
            <button
              className={`rounded-full px-4 py-2 text-sm font-medium ${!showReels ? "bg-white border border-gray-200" : "bg-transparent text-slate-700"}`}
              onClick={() => setShowReels(false)}
            >
              List
            </button>
          </div>
        </div>
        <div>
          {error ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center text-rose-700">
              <p className="font-medium">Could not load community feed</p>
              <p className="mt-2 text-sm">{error}</p>
              <p className="mt-2 text-xs text-slate-600">Check your Firebase project env vars and Firestore rules (sharedIdeas read access).</p>
            </div>
          ) : ideas.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-slate-600">No public ideas have been shared yet.</div>
          ) : showReels ? (
            <ReelsFeed items={ideas} />
          ) : (
            <div className="space-y-4">
              {ideas.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} allowEdit={false} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
