'use client';

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import MediaPreview from "@/components/MediaPreview";
import Link from "next/link";

export default function SharePage() {
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const shareId = params?.shareId;
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!shareId) {
      setError("No share ID found");
      setLoading(false);
      return;
    }

    // Wait for auth to finish loading before trying to fetch user data
    if (authLoading) {
      return;
    }

    const loadIdea = async () => {
      try {
        // First try to load from sharedIdeas (for publicly shared links)
        const shareRef = doc(db, "sharedIdeas", shareId);
        const snapshot = await getDoc(shareRef);

        if (snapshot.exists()) {
          setIdea(snapshot.data());
          setError(null);
          setLoading(false);
          return;
        }

        // If not in sharedIdeas and user is logged in, try their vault
        if (user) {
          const userDocRef = doc(db, "users", user.uid, "ideas", shareId);
          const userSnap = await getDoc(userDocRef);
          
          if (userSnap.exists()) {
            setIdea(userSnap.data());
            setError(null);
            setLoading(false);
            return;
          }
        }

        // Not found in either location
        setError("Share link not found");
        setIdea(null);
      } catch (err) {
        console.error("Error loading share:", err);
        setError("Failed to load share link");
        setIdea(null);
      } finally {
        setLoading(false);
      }
    };

    loadIdea();
  }, [shareId, user, authLoading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
        <div className="max-w-xl rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/20">
          <h1 className="text-2xl font-semibold mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  if (error || !idea) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
        <div className="max-w-xl rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/20">
          <h1 className="text-2xl font-semibold mb-4">{error || "Share link not found"}</h1>
          <p className="text-slate-400">This share link is invalid or the idea has been removed.</p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm text-slate-300 underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Shared idea</p>
            <h1 className="text-3xl font-semibold">{idea.title || "Idea preview"}</h1>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-6">
          <p className="text-lg leading-8 text-slate-100">{idea.content}</p>
          <MediaPreview media={idea.media} />
        </div>
        {idea.tags && idea.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {idea.tags.map((t) => (
              <span key={t} className="text-xs bg-slate-800/60 px-2 py-1 rounded-full text-slate-200">
                {t}
              </span>
            ))}
          </div>
        )}
        <p className="mt-6 text-sm text-slate-400">
          Shared on {idea.sharedAt?.toDate ? idea.sharedAt.toDate().toLocaleString() : "Unknown"}.
        </p>
      </div>
    </div>
  );
}
