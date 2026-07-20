"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import MediaPreview from "@/components/MediaPreview";
import Link from "next/link";

export default function RecordDetailsClient({ recordId }) {
  const { user, loading } = useAuth();
  const [loadingRecord, setLoadingRecord] = useState(true);
  const [record, setRecord] = useState(null);
  const [versions, setVersions] = useState([]);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (loading) return;

    const load = async () => {
      setLoadingRecord(true);
      try {
        // Try to load from the authenticated user's vault first
        if (user) {
          const userDocRef = doc(db, "users", user.uid, "ideas", recordId);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            setRecord({ id: snap.id, ...snap.data() });
            // Load version history from subcollection
            const versionsQ = query(
              collection(db, "users", user.uid, "ideas", recordId, "versions"),
              orderBy("createdAt", "desc")
            );
            const versionsSnap = await getDocs(versionsQ);
            setVersions(versionsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
            setIsOwner(true);
            setLoadingRecord(false);
            return;
          }
        }

        // Fallback to sharedIdeas public collection
        const sharedRef = doc(db, "sharedIdeas", recordId);
        const sharedSnap = await getDoc(sharedRef);
        if (sharedSnap.exists()) {
          setRecord({ id: sharedSnap.id, ...sharedSnap.data() });
          setVersions([]);
          setIsOwner(false);
        } else {
          setRecord(null);
        }
      } catch (err) {
        console.error("Error loading record:", err);
        setRecord(null);
      }

      setLoadingRecord(false);
    };

    load();
  }, [user, loading, recordId]);

  if (loadingRecord) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-400">Loading record...</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="py-12 text-center">
        <p className="text-rose-400">Record not found.</p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm text-slate-200 underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const createdAtLabel = record.createdAt?.toDate ? record.createdAt.toDate().toLocaleString() : "Unknown";
  const updatedAtLabel = record.updatedAt?.toDate ? record.updatedAt.toDate().toLocaleString() : createdAtLabel;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-slate-400 underline">
          ← Back
        </Link>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-semibold mb-2">{record.title || "Untitled"}</h1>
        <p className="text-sm text-slate-400 mb-4">{record.content}</p>

        {record.tags && record.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {record.tags.map((t) => (
              <span key={t} className="text-xs bg-slate-800/60 px-2 py-1 rounded-full text-slate-200">
                {t}
              </span>
            ))}
          </div>
        )}

        <MediaPreview media={record.media} />

        <div className="mt-6 grid grid-cols-1 gap-2 text-sm text-slate-300">
          <div>
            <strong className="text-slate-200">Origin ID:</strong> {record.originId || record.id}
          </div>
          <div>
            <strong className="text-slate-200">Hash (SHA-256):</strong> {record.hash}
          </div>
          <div>
            <strong className="text-slate-200">Captured:</strong> {createdAtLabel}
          </div>
          <div>
            <strong className="text-slate-200">Last modified:</strong> {updatedAtLabel}
          </div>
          <div>
            <strong className="text-slate-200">Version:</strong> {record.version || "v1"} (#{record.versionNumber || 1})
          </div>
          <div>
            <strong className="text-slate-200">Category:</strong> {record.category || "—"}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold">Version History</h3>
          {versions.length === 0 ? (
            <p className="text-sm text-slate-400 mt-2">No previous versions recorded.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {versions.map((v) => (
                <li key={v.id} className="rounded-lg border border-white/5 bg-white/3 p-3">
                  <div className="text-sm text-slate-200 font-medium">{v.version || `v${v.versionNumber || "?"}`}</div>
                  <div className="text-xs text-slate-400">Saved: {v.createdAt?.toDate ? v.createdAt.toDate().toLocaleString() : "Unknown"}</div>
                  <div className="mt-2 text-sm text-slate-100">{v.title || "(no title)"}</div>
                  <div className="mt-1 text-sm text-slate-300">{v.content}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
