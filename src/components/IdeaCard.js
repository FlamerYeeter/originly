"use client";

export default function IdeaCard({ idea }) {
  const timestamp = idea.createdAt?.toDate
    ? idea.createdAt.toDate().toLocaleString()
    : "Pending...";

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <p className="text-gray-900 mb-3">{idea.content}</p>
      <div className="border-t border-gray-100 pt-3 space-y-1">
        <p className="text-xs text-gray-500">
          <span className="font-medium">Captured:</span> {timestamp}
        </p>
        <p className="text-xs text-gray-500 font-mono break-all">
          <span className="font-medium font-sans">SHA-256:</span> {idea.hash}
        </p>
      </div>
    </div>
  );
}