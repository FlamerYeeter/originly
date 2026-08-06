"use client";

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
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Secure idea vault</p>
            <h1 className="text-lg sm:text-2xl font-semibold tracking-tight">Originly</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <div className="text-right hidden sm:block">
              <p className="text-sm text-muted">{user.displayName || user.email}</p>
              <p className="text-xs text-muted">Logged in</p>
            </div>
            <Link href="/help" className="btn-app">
              Help
            </Link>
            <Link href="/community" className="btn-app">
              Community
            </Link>
            <button onClick={handleSignOut} className="btn-app hidden sm:inline-flex">
              Sign out
            </button>
            <button onClick={handleSignOut} className="btn-app inline-flex sm:hidden p-2" aria-label="Sign out">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M16 13v-2H7V8l-5 4 5 4v-3h9z" />
                <path d="M20 3h-8v2h8v14h-8v2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        <div className="glass-card overflow-hidden rounded-[2rem] border-border p-6 text-foreground bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl font-semibold">Capture ideas</h2>
              <p className="mt-1 text-sm text-muted">
                Capture or verify ideas fast and keep your idea vault up to date.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("capture")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === "capture"
                    ? "bg-slate-100 text-slate-950"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Capture
              </button>
              <button
                onClick={() => setActiveTab("verify")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === "verify"
                    ? "bg-slate-100 text-slate-950"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Verify
              </button>
            </div>
          </div>

          <section>{activeTab === "capture" ? <CaptureForm /> : <VerifyForm />}</section>
        </div>

        <section className="glass-card rounded-[2rem] border-border bg-surface p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-muted">Your Vault</p>
              <h2 className="text-2xl font-semibold">{ideas.length} idea{ideas.length === 1 ? "" : "s"}</h2>
            </div>
          </div>
          <div className="space-y-4">
            {ideas.length === 0 ? (
              <p className="text-muted text-center py-10">
                No ideas yet. Capture your first one above.
              </p>
            ) : (
              ideas.map((idea) => <IdeaCard key={idea.id} idea={idea} />)
            )}
          </div>
        </section>
      </main>
    </div>
  );
}