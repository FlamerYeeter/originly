'use client';

export default function MediaPreview({ media = [], watermarkEnabled = true, watermarkText = "Made in Originly" }) {
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
          <div key={`${file.path || file.publicUrl || index}`} className="rounded-2xl border border-gray-100 bg-white p-3">
            {isImage && file.publicUrl ? (
              <div className="relative">
                <img
                  src={file.publicUrl}
                  alt={file.name || "Idea attachment"}
                  className="max-h-80 w-full rounded-xl object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                    event.currentTarget.parentElement?.appendChild(
                      Object.assign(document.createElement("div"), {
                        className: "rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-slate-500",
                        textContent: "This attachment could not be loaded. Check your Supabase bucket and permissions.",
                      })
                    );
                  }}
                />
                {watermarkEnabled && watermarkText ? (
                  <span className="pointer-events-none absolute right-3 bottom-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white shadow-sm">
                    {watermarkText}
                  </span>
                ) : null}
              </div>
            ) : null}

            {isAudio && file.publicUrl ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-700">{file.name || "Audio attachment"}</p>
                <audio controls className="w-full" onError={(event) => {
                  event.currentTarget.style.display = "none";
                  event.currentTarget.parentElement?.appendChild(
                    Object.assign(document.createElement("div"), {
                      className: "rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-slate-500",
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
                <p className="text-sm text-slate-700">{file.name || "Video attachment"}</p>
                <div className="relative">
                  <video controls className="w-full rounded-xl" onError={(event) => {
                    event.currentTarget.style.display = "none";
                    event.currentTarget.parentElement?.appendChild(
                      Object.assign(document.createElement("div"), {
                        className: "rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-slate-500",
                        textContent: "This video attachment could not be loaded. Check your Supabase bucket and permissions.",
                      })
                    );
                  }}>
                    <source src={file.publicUrl} type={file.mimeType} />
                  </video>
                  {watermarkEnabled && watermarkText ? (
                    <span className="pointer-events-none absolute right-3 bottom-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white shadow-sm">
                      {watermarkText}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}

            {isDocument && file.publicUrl ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{file.name || "Document attachment"}</p>
                  <p className="text-xs text-slate-500">{file.mimeType || "File"}</p>
                </div>
                <a
                  href={file.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-white bg-primary shadow-sm hover:opacity-95"
                  style={{ background: 'linear-gradient(90deg, var(--primary), #8b6bff)' }}
                >
                  Open
                </a>
              </div>
            ) : null}

            {!file.publicUrl ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-slate-500">
                This attachment could not be loaded. Check your Supabase bucket and permissions.
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
