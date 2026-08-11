"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import IdeaCard from "@/components/IdeaCard";
import ReelsFeed from "@/components/ReelsFeed";
import StoryReelsStrip from "@/components/StoryReelsStrip";

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
        <StoryReelsStrip
          items={(ideas && ideas.length > 0 ? ideas.slice(0, 12).map((item) => ({
            id: item.id,
            ownerName: item.ownerName || 'User',
            title: item.title || 'Public idea',
            description: item.description || 'Publicly shared idea',
            thumb: (item.media && item.media[0]?.publicUrl) || '/OriginlyLogo.png',
          })) : Array.from({ length: 6 }).map((_, i) => ({
            id: `ph-${i}`,
            ownerName: 'User',
            title: 'Placeholder story',
            description: 'This preview will be replaced by real community posts.',
            thumb: '/OriginlyLogo.png',
          })))}
          title="Latest Reels"
          subtitle="Swipe through recent public ideas shared by the community."
        />

        <div className="section-card mb-8">
          <div className="card-header">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Community feed</p>
              <h1 className="heading-1">Other people's ideas</h1>
              <p className="lead">Browse public ideas shared around the community.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className={showReels ? "btn-secondary" : "btn-outline"}
                onClick={() => setShowReels(true)}
              >
                Reels
              </button>
              <button
                className={!showReels ? "btn-secondary" : "btn-outline"}
                onClick={() => setShowReels(false)}
              >
                List
              </button>
            </div>
          </div>
        </div>
        <div>
          {error ? (
            <div className="section-card border-rose-100 bg-rose-50 text-center text-rose-700">
              <p className="font-medium">Could not load community feed</p>
              <p className="mt-2 text-sm">{error}</p>
              <p className="mt-2 text-xs text-muted">Check your Firebase project env vars and Firestore rules (sharedIdeas read access).</p>
            </div>
          ) : ideas.length === 0 ? (
            <div className="section-card text-center text-muted">No public ideas have been shared yet.</div>
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
