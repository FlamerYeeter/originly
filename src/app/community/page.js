"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import IdeaCard from "@/components/IdeaCard";

export default function CommunityPage() {
  const [ideas, setIdeas] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "sharedIdeas"),
      where("visibility", "==", "public"),
      orderBy("sharedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sharedIdeas = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setIdeas(sharedIdeas);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-10">
      <main className="max-w-4xl mx-auto px-4 pt-10">
        <div className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Community feed</p>
            <h1 className="text-3xl font-semibold">Other people&apos;s ideas</h1>
            <p className="mt-2 text-slate-400">Browse public ideas shared around the community.</p>
          </div>
        </div>

        <div className="space-y-4">
          {ideas.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">
              No public ideas have been shared yet.
            </div>
          ) : (
            ideas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
