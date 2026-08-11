"use client";

import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import CaptureForm from "@/components/CaptureForm";
import IdeaCard from "@/components/IdeaCard";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import VerifyForm from "@/components/VerifyForm";
import StoryReelsStrip from "@/components/StoryReelsStrip";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [ideas, setIdeas] = useState([]);
  // Track which tab is active: "capture" or "verify"
  const [activeTab, setActiveTab] = useState("capture");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "ideas"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ideasData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setIdeas(ideasData);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSignOut = async () => {
    await signOut(auth);
  };
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8 bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur-xl">
        <div className="container-max flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Image src="/OriginlyLogo.png" alt="Originly logo" width={36} height={36} />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Secure idea vault</p>
              <h1 className="heading-2 tracking-tight">Originly</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <Link href="/help" className="btn-app p-2" aria-label="Help">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M9.09 9a3 3 0 1 1 5.82 1c-.1.43-.38.78-.77 1.07-.35.27-.69.6-.9 1.02-.18.35-.28.75-.28 1.2" />
                <circle cx="12" cy="17" r="1" />
              </svg>
            </Link>
            <Link href="/community" className="btn-app p-2" aria-label="Community">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.85" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </Link>
            <button onClick={handleSignOut} className="btn-app p-2" aria-label="Sign out">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        <StoryReelsStrip
          items={ideas.slice(0, 8).map((idea) => ({
            id: idea.id,
            ownerName: idea.ownerName || "You",
            title: idea.title || "Idea story",
            description: idea.description || "Your saved idea",
            thumb: idea.media?.[0]?.publicUrl || "/OriginlyLogo.png",
          }))}
          title="Latest Reels"
          subtitle="Swipe and tap through your recent ideas."
        />

        <div className="glass-card overflow-hidden rounded-[2rem] border-border p-6 text-foreground bg-surface">
          <div className="card-header mb-6">
            <div>
              <h2 className="heading-3">Capture ideas</h2>
              <p className="mt-1 text-sm text-muted">Capture or verify ideas fast and keep your idea vault up to date.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => router.push("/capture")}
                className="btn-secondary"
              >
                Capture
              </button>
              <button
                onClick={() => setActiveTab("verify")}
                className="btn-outline"
              >
                Verify
              </button>
            </div>
          </div>

          <section>
            {activeTab === "verify" ? (
              <VerifyForm />
            ) : (
              <div className="text-sm text-muted">
                Use the Capture button above to record new ideas on the dedicated capture page.
              </div>
            )}
          </section>
        </div>

        <section className="glass-card rounded-[2rem] border-border bg-surface p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-muted">Your Vault</p>
              <h2 className="heading-2">{ideas.length} idea{ideas.length === 1 ? "" : "s"}</h2>
            </div>
          </div>
          <div className="space-y-4">
            {ideas.length === 0 ? (
              <p className="text-muted text-center py-10">No ideas yet. Capture your first one above.</p>
            ) : (
              ideas.map((idea) => <IdeaCard key={idea.id} idea={idea} />)
            )}
          </div>
        </section>
      </main>
    </div>
  );
}