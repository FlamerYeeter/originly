"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export default function StoryReelsStrip({
  items = [],
  title = "Latest Reels",
  subtitle = "Swipe through recent stories",
  emptyLabel = "No stories yet",
  onSelect,
}) {
  const stripRef = useRef(null);
  const [activeStory, setActiveStory] = useState(() => {
    return Array.isArray(items) && items.length > 0 ? items[0] : null;
  });
  const [showScrollControls, setShowScrollControls] = useState(false);

  const stories = useMemo(() => {
    const baseItems = Array.isArray(items) ? items : [];
    return baseItems.length > 0
      ? baseItems
      : [
          {
            id: "empty",
            ownerName: "No stories",
            title: emptyLabel,
            description: "No stories available right now.",
            thumb: "/OriginlyLogo.png",
          },
        ];
  }, [items, emptyLabel]);

  useEffect(() => {
    if (!Array.isArray(items) || items.length === 0) {
      setActiveStory(null);
      return;
    }

    const currentId = activeStory?.id;
    const matchingStory = currentId ? stories.find((story) => story.id === currentId) : null;

    if (matchingStory) {
      if (matchingStory !== activeStory) {
        setActiveStory(matchingStory);
      }
      return;
    }

    setActiveStory(stories[0]);
  }, [items, stories, activeStory]);

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

  useEffect(() => {
    const updateScrollControls = () => {
      const el = stripRef.current;
      if (!el) return;
      setShowScrollControls(el.scrollWidth > el.clientWidth + 8);
    };

    updateScrollControls();

    if (typeof ResizeObserver !== "undefined" && stripRef.current) {
      const observer = new ResizeObserver(updateScrollControls);
      observer.observe(stripRef.current);
      return () => observer.disconnect();
    }
  }, [stories]);

  return (
    <div className="rounded-[2rem] border border-violet-200/70 bg-violet-50/90 p-4 shadow-[0_16px_60px_-40px_rgba(124,58,237,0.45)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-violet-600">Community stories</p>
          <h2 className="heading-2 text-slate-900">{title}</h2>
          <p className="lead">{subtitle}</p>
        </div>
      </div>

      <div className="relative">
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

        {showScrollControls && (
          <>
            <button
              type="button"
              onClick={() => scrollStrip(-1)}
              className="pointer-events-auto absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/95 p-2 text-slate-700 shadow-sm shadow-slate-200 border border-slate-200"
              aria-label="Scroll stories left"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => scrollStrip(1)}
              className="pointer-events-auto absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/95 p-2 text-slate-700 shadow-sm shadow-slate-200 border border-slate-200"
              aria-label="Scroll stories right"
            >
              →
            </button>
          </>
        )}
      </div>

      {activeStory && (
        <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-white/90 p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Selected story</p>
              <h3 className="heading-3 text-slate-900">{activeStory.title || "Story preview"}</h3>
            </div>
            <Link
              href={activeStory.id ? `/share/?id=${encodeURIComponent(activeStory.id)}` : "/share/"}
              className="btn-outline text-xs"
              aria-label={activeStory.id ? `Focus story ${activeStory.title}` : "Open share page"}
            >
              Tap to focus
            </Link>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {activeStory.description ||
              "Select a story to preview it here, then tap to open it in the focused view."}
          </p>
        </div>
      )}
    </div>
  );
}
