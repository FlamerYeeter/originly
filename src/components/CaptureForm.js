"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { generateHash } from "@/lib/hash";

export default function CaptureForm() {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || saving) return;

    setSaving(true);
    try {
      // Generate a SHA-256 fingerprint of the idea
      const hash = await generateHash(content.trim());
      // Save the idea, its hash, and a server timestamp to Firestore
      await addDoc(collection(db, "users", user.uid, "ideas"), {
        content: content.trim(),
        hash: hash,
        createdAt: serverTimestamp(),
      });
      setContent("");
    } catch (error) {
      console.error("Error saving idea:", error);
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's your idea?"
        className="w-full p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 min-h-[120px] text-gray-900 bg-white"
      />
      <button
        type="submit"
        disabled={!content.trim() || saving}
        className="mt-3 w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "Capturing..." : "Capture Idea"}
      </button>
    </form>
  );
}