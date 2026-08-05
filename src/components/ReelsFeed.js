"use client";

import { useEffect, useRef } from "react";

export default function ReelsFeed({ items = [] }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Play/pause videos when they enter viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target.querySelector("video");
          if (!video) return;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            try {
              video.pause();
            } catch {}
          }
        });
      },
      { threshold: 0.6 }
    );

    const nodes = Array.from(container.querySelectorAll(".reel-item"));
    nodes.forEach((n) => observer.observe(n));

    return () => observer.disconnect();
  }, [items]);

  if (!items || items.length === 0) {
    return <div className="p-6 text-center text-slate-600">No reels available</div>;
  }

  return (
    <div
      ref={containerRef}
      className="reels-container h-[calc(100vh-80px)] overflow-y-auto snap-y snap-mandatory"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {items.map((item) => {
        const media = (item.media && item.media[0]) || null;
        const isVideo = media?.mimeType?.startsWith("video/");
        const isAudio = media?.mimeType?.startsWith("audio/");

        return (
          <div key={item.id} className="reel-item snap-start h-[calc(100vh-80px)] flex items-center justify-center p-6">
            <div className="w-full max-w-3xl rounded-2xl overflow-hidden glass-card p-5 flex flex-col md:flex-row gap-4" style={{ height: "100%" }}>
              <div className="flex-1 flex items-center justify-center">
                {isVideo && media?.publicUrl ? (
                  <video
                    src={media.publicUrl}
                    controls
                    playsInline
                    muted
                    loop
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : isAudio && media?.publicUrl ? (
                  <div className="w-full">
                    <p className="text-sm text-slate-700">{media.name || "Audio"}</p>
                    <audio controls className="w-full mt-2">
                      <source src={media.publicUrl} type={media.mimeType} />
                    </audio>
                  </div>
                ) : media?.publicUrl ? (
                  <img src={media.publicUrl} alt={media.name || "media"} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl">
                    <p className="text-slate-600">No preview available</p>
                  </div>
                )}
              </div>

              <div className="md:w-1/3 flex flex-col gap-3">
                <div>
                  <p className="text-xs text-slate-500">{item.ownerName || item.owner || "Creator"}</p>
                  <h3 className="text-lg font-semibold text-slate-900 mt-1">{item.title || item.category || "Untitled"}</h3>
                </div>
                <p className="text-slate-700 leading-relaxed flex-1 overflow-auto">{item.content}</p>
                <div className="flex items-center gap-2">
                  <span className="soft-pill">{item.visibility}</span>
                  <span className="soft-pill">{item.tags?.slice(0,3).join(", ")}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
