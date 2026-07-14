'use client';

export default function MediaPreview({ media = [] }) {
  if (!Array.isArray(media) || media.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3">
      {media.map((file, index) => {
        const isImage = file.mimeType?.startsWith("image/");
        const isAudio = file.mimeType?.startsWith("audio/");
        const isVideo = file.mimeType?.startsWith("video/");
        const isDocument = !isImage && !isAudio && !isVideo;

        return (
          <div key={`${file.path || file.publicUrl || index}`} className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
            {isImage && file.publicUrl ? (
              <img
                src={file.publicUrl}
                alt={file.name || "Idea attachment"}
                className="max-h-80 w-full rounded-xl object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                  event.currentTarget.parentElement?.appendChild(
                    Object.assign(document.createElement("div"), {
                      className: "rounded-xl border border-dashed border-slate-600 bg-slate-900/80 p-4 text-sm text-slate-400",
                      textContent: "This attachment could not be loaded. Check your Supabase bucket and permissions.",
                    })
                  );
                }}
              />
            ) : null}

            {isAudio && file.publicUrl ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-300">{file.name || "Audio attachment"}</p>
                <audio controls className="w-full" onError={(event) => {
                  event.currentTarget.style.display = "none";
                  event.currentTarget.parentElement?.appendChild(
                    Object.assign(document.createElement("div"), {
                      className: "rounded-xl border border-dashed border-slate-600 bg-slate-900/80 p-4 text-sm text-slate-400",
                      textContent: "This audio attachment could not be loaded. Check your Supabase bucket and permissions.",
                    })
                  );
                }}>
                  <source src={file.publicUrl} type={file.mimeType} />
                </audio>
              </div>
            ) : null}

            {isVideo && file.publicUrl ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-300">{file.name || "Video attachment"}</p>
                <video controls className="w-full rounded-xl" onError={(event) => {
                  event.currentTarget.style.display = "none";
                  event.currentTarget.parentElement?.appendChild(
                    Object.assign(document.createElement("div"), {
                      className: "rounded-xl border border-dashed border-slate-600 bg-slate-900/80 p-4 text-sm text-slate-400",
                      textContent: "This video attachment could not be loaded. Check your Supabase bucket and permissions.",
                    })
                  );
                }}>
                  <source src={file.publicUrl} type={file.mimeType} />
                </video>
              </div>
            ) : null}

            {isDocument && file.publicUrl ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-100">{file.name || "Document attachment"}</p>
                  <p className="text-xs text-slate-400">{file.mimeType || "File"}</p>
                </div>
                <a
                  href={file.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
                >
                  Open
                </a>
              </div>
            ) : null}

            {!file.publicUrl ? (
              <div className="rounded-xl border border-dashed border-slate-600 bg-slate-900/80 p-4 text-sm text-slate-400">
                This attachment could not be loaded. Check your Supabase bucket and permissions.
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
