"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function StoryReelsStrip({
  items = [],
  title = "Latest Reels",
  subtitle = "Swipe through recent stories",
  emptyLabel = "No stories yet",
  onSelect,
}) {
  const [activeStory, setActiveStory] = useState(items[0] ?? null);
  const stripRef = useRef(null);
  const router = useRouter();

  const stories = useMemo(() => {
    const baseItems = Array.isArray(items) ? items : [];
    return baseItems.length > 0
      ? baseItems
      : [
          {
            id: "empty",
            ownerName: "No stories",
            title: emptyLabel,
            thumb: "/OriginlyLogo.png",
          },
        ];
  }, [items, emptyLabel]);

  const selectStory = (story) => {
    setActiveStory(story);
    onSelect?.(story);
  };

  const scrollStrip = (direction) => {
    const el = stripRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * 220, behavior: "smooth" });
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollStrip(1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollStrip(-1);
    }
  };

  return (
    <div className="rounded-[2rem] border border-violet-200/70 bg-violet-50/90 p-4 shadow-[0_16px_60px_-40px_rgba(124,58,237,0.45)]">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-violet-600">Community stories</p>
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollStrip(-1)}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm"
            aria-label="Scroll stories left"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scrollStrip(1)}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm"
            aria-label="Scroll stories right"
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={stripRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="stories-strip overflow-x-auto rounded-[2rem] bg-white/95 p-3 shadow-sm shadow-slate-200/50"
        aria-label="Horizontal story reels"
      >
        {stories.map((story) => {
          const ownerName = (story.ownerName || story.name || "Story").split(" ")[0];
          const thumb = story.thumb || story.media?.[0]?.publicUrl || story.image || "/OriginlyLogo.png";
          const isActive = activeStory?.id === story.id;

          return (
            <button
              key={story.id}
              type="button"
              onClick={() => selectStory(story)}
              className={`stories-item min-w-[96px] rounded-3xl border p-3 text-center transition-all ${
                isActive ? "border-violet-400 bg-violet-50 shadow-sm" : "border-slate-200 bg-slate-100"
              }`}
              aria-label={`Open story from ${ownerName}`}
            >
              <div className="mx-auto mb-2 h-18 w-18 overflow-hidden rounded-full border-2 border-white bg-slate-200 shadow-sm shadow-slate-200/60">
                <img src={thumb} alt={story.title || "story"} className="h-full w-full object-cover" />
              </div>
              <p className="truncate text-xs font-semibold text-slate-600">{ownerName}</p>
            </button>
          );
        })}
      </div>

      {activeStory && (
        <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-white/90 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Selected story</p>
              <h3 className="text-lg font-semibold text-slate-900">{activeStory.title || "Story preview"}</h3>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/share/${activeStory.id}`)}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Tap to focus
            </button>
          </div>
          {activeStory.description ? (
            <p className="mt-2 text-sm text-slate-600">{activeStory.description}</p>
          ) : (
            <p className="mt-2 text-sm text-slate-600">
              This story card is now interactive and keyboard accessible. Use the arrow buttons or swipe to browse the reel.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
