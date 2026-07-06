export default function ShareIndexPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="max-w-xl rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/20">
        <h1 className="text-2xl font-semibold mb-4">No share link provided</h1>
        <p className="text-slate-400">Use a URL like <code className="rounded bg-slate-900 px-2 py-1">/share/&lt;id&gt;</code> to view a shared idea.</p>
      </div>
    </div>
  );
}
