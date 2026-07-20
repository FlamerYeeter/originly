import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import MediaPreview from "@/components/MediaPreview";

export function generateStaticParams() {
  return [{ shareId: "example" }];
}

export default async function SharePage({ params }) {
  const { shareId } = await params;

  if (!shareId) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
        <div className="max-w-xl rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/20">
          <h1 className="text-2xl font-semibold mb-4">No share ID found</h1>
          <p className="text-slate-400">Please use a valid share link with an ID.</p>
        </div>
      </div>
    );
  }

  const shareRef = doc(db, "sharedIdeas", shareId);
  const snapshot = await getDoc(shareRef);

  if (!snapshot.exists()) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
        <div className="max-w-xl rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/20">
          <h1 className="text-2xl font-semibold mb-4">Share link not found</h1>
          <p className="text-slate-400">This share link is invalid or the idea has been removed.</p>
        </div>
      </div>
    );
  }

  const idea = snapshot.data();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Shared idea</p>
            <h1 className="text-3xl font-semibold">{idea.title || "Idea preview"}</h1>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-6">
          <p className="text-lg leading-8 text-slate-100">{idea.content}</p>
          <MediaPreview media={idea.media} />
        </div>
        {idea.tags && idea.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {idea.tags.map((t) => (
              <span key={t} className="text-xs bg-slate-800/60 px-2 py-1 rounded-full text-slate-200">
                {t}
              </span>
            ))}
          </div>
        )}
        <p className="mt-6 text-sm text-slate-400">
          Shared on {idea.sharedAt?.toDate ? idea.sharedAt.toDate().toLocaleString() : "Unknown"}.
        </p>
      </div>
    </div>
  );
}
