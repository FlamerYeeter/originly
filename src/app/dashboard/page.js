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
    <div className="min-h-screen pb-8">
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <h1 className="text-lg font-bold text-gray-900">Originly</h1>
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          Sign out
        </button>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("capture")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "capture"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Capture
          </button>
          <button
            onClick={() => setActiveTab("verify")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "verify"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Verify
          </button>
        </div>

        <section>
          {activeTab === "capture" ? <CaptureForm /> : <VerifyForm />}
        </section>

        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Your Vault ({ideas.length})
          </h2>
          <div className="space-y-3">
            {ideas.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
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