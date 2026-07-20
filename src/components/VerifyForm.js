"use client";

import { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { generateHash } from "@/lib/hash";

export default function VerifyForm() {
  const [content, setContent] = useState("");
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const { user } = useAuth();

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!content.trim() || checking) return;

    setChecking(true);
    setResult(null);

    try {
      // Hash the pasted text using the same SHA-256 function
      const hash = await generateHash(content.trim());
      // Query Firestore for any idea with a matching hash
      const q = query(
        collection(db, "users", user.uid, "ideas"),
        where("hash", "==", hash)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // Match found - retrieve the original capture date and title
        const matchedIdea = snapshot.docs[0].data();
        const capturedDate = matchedIdea.createdAt?.toDate
          ? matchedIdea.createdAt.toDate().toLocaleString()
          : "Unknown";
        setResult({
          match: true,
          title: matchedIdea.title || null,
          message: `Integrity verified. This idea was captured on ${capturedDate} and has not been altered.`,
          hash: hash,
        });
      } else {
        // No match - the text does not correspond to any captured idea
        setResult({
          match: false,
          message: "No matching idea found. This text does not match any captured idea.",
          hash: hash,
        });
      }
    } catch (error) {
      console.error("Verification error:", error);
      setResult({ match: false, message: "Error during verification." });
    }
    setChecking(false);
  };

  return (
    <form onSubmit={handleVerify} className="w-full">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Paste text to verify its integrity..."
        className="w-full p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 min-h-[120px] text-gray-900 bg-white"
      />
      <button
        type="submit"
        disabled={!content.trim() || checking}
        className="mt-3 w-full bg-gray-700 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {checking ? "Checking..." : "Check Integrity"}
      </button>

      {result && (
        <div
          className={`mt-4 p-4 rounded-3xl border ${
            result.match
              ? "bg-emerald-950/70 border-emerald-500/20 text-emerald-100"
              : "bg-rose-950/70 border-rose-500/20 text-rose-100"
          }`}
        >
          {result.title && <p className="text-sm font-semibold">Title: {result.title}</p>}
          <p className="text-sm font-medium">{result.message}</p>
        </div>
      )}
    </form>
  );
}