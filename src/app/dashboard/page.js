"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import CaptureForm from "@/components/CaptureForm";
import IdeaCard from "@/components/IdeaCard";
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
    <div className="min-h-screen pb-8 bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/95 backdrop-blur-xl px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Secure idea vault</p>
            <h1 className="text-2xl font-semibold tracking-tight">Originly</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-slate-300">{user.displayName || user.email}</p>
              <p className="text-xs text-slate-500">Logged in</p>
            </div>
            <button
              onClick={handleSignOut}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        <div className="glass-card overflow-hidden rounded-[2rem] border-white/10 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl font-semibold">Capture ideas</h2>
              <p className="mt-1 text-sm text-slate-400">
                Keep the black-and-white theme while giving the dashboard a cleaner, modern look.
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

        <section className="glass-card rounded-[2rem] border-white/10 p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Your Vault</p>
              <h2 className="text-2xl font-semibold">{ideas.length} idea{ideas.length === 1 ? "" : "s"}</h2>
            </div>
          </div>
          <div className="space-y-4">
            {ideas.length === 0 ? (
              <p className="text-slate-400 text-center py-10">
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