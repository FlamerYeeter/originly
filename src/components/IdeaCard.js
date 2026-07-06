"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

export default function IdeaCard({ idea }) {
  const { user } = useAuth();
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    if (idea.shareId && typeof window !== "undefined") {
      setShareUrl(`${window.location.origin}/share/${idea.shareId}`);
    }
  }, [idea.shareId]);

  const timestamp = idea.createdAt?.toDate
    ? idea.createdAt.toDate().toLocaleString()
    : "Pending...";

  const handleShare = async () => {
    if (!user || sharing) return;
    setSharing(true);
    setShareMessage("");

    try {
      const shareId = idea.shareId || crypto.randomUUID().replace(/-/g, "").slice(0, 12);
      const shareDoc = doc(db, "sharedIdeas", shareId);
      const ideaDoc = doc(db, "users", user.uid, "ideas", idea.id);

      await setDoc(
        shareDoc,
        {
          ownerUid: user.uid,
          ideaId: idea.id,
          content: idea.content,
          capturedAt: idea.createdAt || serverTimestamp(),
          sharedAt: serverTimestamp(),
        },
        { merge: true }
      );

      if (!idea.shareId) {
        await updateDoc(ideaDoc, { shareId });
      }

      if (typeof window !== "undefined") {
        const url = `${window.location.origin}/share/${shareId}`;
        setShareUrl(url);
        await navigator.clipboard.writeText(url);
      }

      setShareMessage("Share link created and copied to clipboard.");
    } catch (error) {
      console.error("Share link error:", error);
      setShareMessage("Could not create share link. Try again.");
    }

    setSharing(false);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20">
      <p className="text-slate-100 mb-4 text-base leading-7">{idea.content}</p>
      <div className="border-t border-white/10 pt-4">
        <p className="text-xs text-slate-400">
          <span className="font-medium text-slate-200">Captured:</span> {timestamp}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          SHA-256 hash is stored securely and hidden from the interface.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleShare}
            disabled={sharing}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sharing ? "Sharing..." : "Share Idea"}
          </button>
          {shareUrl && (
            <a
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-slate-300 underline-offset-2 hover:text-slate-100"
            >
              View link
            </a>
          )}
        </div>
        {shareMessage && <p className="mt-2 text-xs text-emerald-300">{shareMessage}</p>}
      </div>
    </div>
  );
}