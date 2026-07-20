"use client";

import { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

export default function PublicVerifyForm() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const originQuery = query(
        collection(db, "sharedIdeas"),
        where("originId", "==", trimmed)
      );
      const originSnapshot = await getDocs(originQuery);
      if (!originSnapshot.empty) {
        const doc = originSnapshot.docs[0];
        setResult({ id: doc.id, data: doc.data() });
        setLoading(false);
        return;
      }

      const hashQuery = query(
        collection(db, "sharedIdeas"),
        where("hash", "==", trimmed)
      );
      const hashSnapshot = await getDocs(hashQuery);
      if (!hashSnapshot.empty) {
        const doc = hashSnapshot.docs[0];
        setResult({ id: doc.id, data: doc.data() });
      } else {
        setError("No public record found for that Origin ID or hash.");
      }
    } catch (err) {
      console.error("Public verification error:", err);
      setError("Unable to verify at this time.");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20">
        <h1 className="text-3xl font-semibold mb-3">Public Verification</h1>
        <p className="text-slate-400 mb-6">
          Verify a shared Originly record by its Origin ID or fingerprint hash.
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <label className="block text-sm font-medium text-slate-200">Origin ID or SHA-256 hash</label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter Origin ID or hash"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-slate-100 outline-none focus:border-slate-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-950 hover:bg-slate-200 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}

        {result && (
          <div className="mt-6 rounded-3xl border border-slate-700 bg-slate-950/90 p-5 text-slate-100">
            <p className="text-sm text-slate-400">Record found.</p>
            <h2 className="mt-3 text-xl font-semibold">{result.data.title || "Untitled"}</h2>
            <p className="mt-2 text-sm text-slate-300">{result.data.content}</p>
            <div className="mt-4 grid gap-2 text-sm text-slate-300">
              <div>
                <span className="font-medium text-slate-200">Origin ID:</span> {result.data.originId}
              </div>
              <div>
                <span className="font-medium text-slate-200">Hash:</span> {result.data.hash}
              </div>
              <div>
                <span className="font-medium text-slate-200">Version:</span> {result.data.version || "v1"}
              </div>
              <div>
                <span className="font-medium text-slate-200">Visibility:</span> {result.data.visibility}
              </div>
            </div>
            {result.data.tags && result.data.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {result.data.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-200">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Link href={`/record/${result.id}`} className="text-sm text-slate-100 underline">
                View public record details
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
