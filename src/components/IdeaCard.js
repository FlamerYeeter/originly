"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, updateDoc, serverTimestamp, increment, arrayUnion, arrayRemove, collection, addDoc } from "firebase/firestore";
import MediaPreview from "@/components/MediaPreview";

export default function IdeaCard({ idea }) {
  const { user } = useAuth();
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [likes, setLikes] = useState(idea.likes || 0);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(idea.content);
  const [editTitle, setEditTitle] = useState(idea.title || "");
  const [editVisibility, setEditVisibility] = useState(idea.visibility || "private");
  const [editCategory, setEditCategory] = useState(idea.category || "💡 Idea");
  const [editTags, setEditTags] = useState((idea.tags || []).join(", "));
  const [editTitleError, setEditTitleError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const visibility = idea.visibility || "private";
  const isPublic = visibility === "public";

  useEffect(() => {
    if (idea.shareId && typeof window !== "undefined") {
      setShareUrl(`${window.location.origin}/share/${idea.shareId}`);
    }
  }, [idea.shareId]);

  useEffect(() => {
    setLikes(idea.likes || 0);
    setLiked(Boolean(user && idea.likedBy?.includes(user.uid)));
    if (!editing) {
      setEditContent(idea.content);
      setEditVisibility(idea.visibility || "private");
      setEditCategory(idea.category || "💡 Idea");
      setEditTitle(idea.title || "");
      setEditTags((idea.tags || []).join(", "));
      setEditTitleError("");
    }
  }, [idea.likes, idea.likedBy, idea.content, idea.visibility, user, editing]);

  const createdAt = idea.createdAt?.toDate ? idea.createdAt.toDate().toLocaleString() : "Pending...";
  const capturedAt = idea.capturedAt?.toDate ? idea.capturedAt.toDate().toLocaleString() : createdAt;
  const locationLabel = idea.location
    ? idea.location.name || `${idea.location.latitude.toFixed(4)}, ${idea.location.longitude.toFixed(4)}`
    : null;

  const categoryLabel = idea.category || "💡 Idea";

  const handleShare = async () => {
    if (!user || sharing || !isPublic) return;
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
          ownerName: user.displayName || user.email || "Anonymous",
          ideaId: idea.id,
          title: idea.title || null,
          tags: idea.tags || null,
          content: idea.content,
          // explicitly store visibility so community view shows correct badge
          visibility: idea.visibility || "public",
          category: idea.category || null,
          capturedAt: idea.createdAt || serverTimestamp(),
          sharedAt: serverTimestamp(),
          location: idea.location || null,
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

  const handleLike = async () => {
    if (!user || liking) return;
    setLiking(true);

    const ideaDoc = doc(db, "users", user.uid, "ideas", idea.id);
    const nextLiked = !liked;

    try {
      await updateDoc(ideaDoc, {
        likes: increment(nextLiked ? 1 : -1),
        likedBy: nextLiked ? arrayUnion(user.uid) : arrayRemove(user.uid),
      });
      setLikes((prev) => prev + (nextLiked ? 1 : -1));
      setLiked(nextLiked);
    } catch (error) {
      console.error("Like update error:", error);
    }

    setLiking(false);
  };

  const startEditing = () => {
    setEditContent(idea.content);
    setEditVisibility(idea.visibility || "private");
    setEditing(true);
    setShareMessage("");
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditContent(idea.content);
    setEditVisibility(idea.visibility || "private");
  };

  const saveEdit = async () => {
    if (!user || savingEdit) return;
    setSavingEdit(true);
    const ideaDoc = doc(db, "users", user.uid, "ideas", idea.id);

    try {
      const nextVersionNumber = (idea.versionNumber ?? 1) + 1;
      const nextVersion = `v${nextVersionNumber}`;
      // Validate title length before saving
      if (editTitle.trim().length > 120) {
        setEditTitleError("Title must be 120 characters or less.");
        setSavingEdit(false);
        return;
      }
      // create a version entry before updating
      try {
        await addDoc(collection(db, "users", user.uid, "ideas", idea.id, "versions"), {
          title: idea.title || null,
          content: idea.content || null,
          tags: idea.tags || null,
          category: idea.category || null,
          version: idea.version || null,
          versionNumber: idea.versionNumber || 1,
          createdAt: serverTimestamp(),
        });
      } catch (verr) {
        console.error("Failed to write version entry:", verr);
      }

      const tagsArray = editTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 20);

      await updateDoc(ideaDoc, {
        title: editTitle.trim(),
        content: editContent.trim(),
        visibility: editVisibility,
        category: editCategory,
        tags: tagsArray,
        updatedAt: serverTimestamp(),
        version: nextVersion,
        versionNumber: nextVersionNumber,
      });
      setEditing(false);
    } catch (error) {
      console.error("Idea update error:", error);
    }

    setSavingEdit(false);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20">
      {editing ? (
        <div className="space-y-4">
          <input
            value={editTitle}
            onChange={(e) => {
              const v = e.target.value;
              setEditTitle(v);
              setEditTitleError(v.trim().length > 120 ? "Title must be 120 characters or less." : "");
            }}
            placeholder="Title (optional)"
            maxLength={120}
            className="w-full mb-3 rounded-md border border-white/10 bg-slate-950/70 p-3 text-slate-100 outline-none"
          />
          {editTitleError && <p className="mt-1 text-xs text-rose-400">{editTitleError}</p>}
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-slate-100 outline-none focus:border-slate-200"
            rows={4}
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-slate-300">
              <input
                type="radio"
                name={`visibility-${idea.id}`}
                value="private"
                checked={editVisibility === "private"}
                onChange={() => setEditVisibility("private")}
                className="h-4 w-4 rounded border-slate-500 bg-slate-950 text-slate-100"
              />
              Private
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-300">
              <input
                type="radio"
                name={`visibility-${idea.id}`}
                value="public"
                checked={editVisibility === "public"}
                onChange={() => setEditVisibility("public")}
                className="h-4 w-4 rounded border-slate-500 bg-slate-950 text-slate-100"
              />
              Public
            </label>
            <div className="w-full mt-2">
              <label className="block mb-2 text-sm text-slate-300">Category</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-900 w-full"
              >
                <option>💡 Idea</option>
                <option>🎵 Music Lyrics</option>
                <option>🎼 Music Riff (audio)</option>
                <option>📄 Story</option>
                <option>🎬 Script</option>
                <option>🎨 Artwork</option>
                <option>📷 Image</option>
                <option>📹 Video</option>
                <option>📁 Document</option>
              </select>
            </div>
            <div className="w-full mt-2">
              <label className="block mb-2 text-sm text-slate-300">Tags</label>
              <input
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="Tags (comma-separated)"
                className="rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-900 w-full"
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          {idea.title ? (
            <h3 className="text-xl font-semibold text-slate-100 mb-2">{idea.title}</h3>
          ) : null}
            {idea.tags && idea.tags.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {idea.tags.map((t) => (
                  <span key={t} className="text-xs bg-slate-800/60 px-2 py-1 rounded-full text-slate-200">
                    {t}
                  </span>
                ))}
              </div>
            )}
            <p className="text-slate-100 mb-4 text-base leading-7">{idea.content}</p>
        </>
      )}
      <MediaPreview media={idea.media} />
      <div className="border-t border-white/10 pt-4">
        <p className="text-xs text-slate-400">
          <span className="font-medium text-slate-200">Captured:</span> {capturedAt}
        </p>
        {locationLabel && (
          <p className="mt-2 text-xs text-slate-400">
            <span className="font-medium text-slate-200">Location:</span> {locationLabel}
          </p>
        )}
        <p className="mt-2 text-xs text-slate-500">
          SHA-256 hash is stored securely and hidden from the interface.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-400">{visibility}</span>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs tracking-[0.02em] text-slate-200">{categoryLabel}</span>
          <button
            type="button"
            onClick={handleLike}
            disabled={!user || liking}
            aria-pressed={liked}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              liked
                ? "bg-rose-500 text-white hover:bg-rose-400"
                : "bg-slate-100 text-slate-950 hover:bg-slate-200"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <span className="mr-2">{liked ? "♥" : "♡"}</span>
            {likes} {likes === 1 ? "Like" : "Likes"}
          </button>
          {editing ? (
            <>
              <button
                type="button"
                onClick={saveEdit}
                disabled={savingEdit}
                className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingEdit ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={savingEdit}
                className="rounded-full bg-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={startEditing}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={handleShare}
                disabled={sharing || !isPublic}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isPublic
                    ? "bg-slate-100 text-slate-950 hover:bg-slate-200"
                    : "bg-slate-700 text-slate-400 cursor-not-allowed"
                } disabled:cursor-not-allowed disabled:opacity-60`}
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
            </>
          )}
        </div>
        {shareMessage && <p className="mt-2 text-xs text-emerald-300">{shareMessage}</p>}
      </div>
    </div>
  );
}