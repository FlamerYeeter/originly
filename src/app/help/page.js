"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function HelpPage() {
  const { user } = useAuth();
  const returnHref = user ? "/dashboard" : "/login";
  const returnLabel = user ? "Back to dashboard" : "Go to login";

  return (
    <div className="min-h-screen pb-8 bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur-xl px-4 py-4">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Originly tutorial</p>
            <h1 className="text-3xl font-semibold tracking-tight">Help &amp; Getting Started</h1>
          </div>
          <Link
            href={returnHref}
            className="btn-app"
          >
            {returnLabel}
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 space-y-8 pt-8">
        <section className="glass-card rounded-[2rem] bg-surface p-8 text-foreground">
          <p className="text-sm uppercase tracking-[0.3em] text-muted">Welcome</p>
          <h2 className="mt-3 text-2xl font-semibold">A simple beginner guide for Originly</h2>
          <p className="mt-4 leading-7 text-muted">
            Originly helps you capture ideas, prove ownership, and verify content over time.
            Follow the quick steps below to start using the app confidently.
          </p>
        </section>

        <section className="grid gap-6">
          <article className="glass-card rounded-[2rem] bg-surface p-8">
            <h3 className="text-xl font-semibold">1. Sign in</h3>
            <p className="mt-3 text-muted">
              Use Google to sign in and access your secure idea vault. Your ideas are stored privately under your account.
            </p>
          </article>

          <article className="glass-card rounded-[2rem] bg-surface p-8">
            <h3 className="text-xl font-semibold">2. Theme switcher</h3>
            <p className="mt-3 text-muted">
              Use the theme toggle button in the dashboard header to switch between light and dark modes and preview both themes.
            </p>
          </article>

          <article className="glass-card rounded-[2rem] bg-surface p-8">
            <h3 className="text-xl font-semibold">3. Capture your first idea</h3>
            <ul className="mt-3 space-y-3 text-muted">
              <li>
                <span className="font-semibold">Title &amp; content:</span> Add a short title and the idea details in the capture form.
              </li>
              <li>
                <span className="font-semibold">Optional media:</span> Attach images or audio to make your capture richer.
              </li>
              <li>
                <span className="font-semibold">Location &amp; visibility:</span> Optionally include your current location and choose whether the idea is private or shareable.
              </li>
              <li>
                <span className="font-semibold">Save:</span> Press the capture button to store the idea and generate a proof hash.
              </li>
            </ul>
          </article>

          <article className="glass-card rounded-[2rem] bg-surface p-8">
            <h3 className="text-xl font-semibold">3. Verify idea integrity</h3>
            <p className="mt-3 text-muted">
              Use the verification tab whenever you want to confirm that text matches a saved idea. Originly checks the content hash against your stored captures.
            </p>
          </article>

          <article className="glass-card rounded-[2rem] bg-surface p-8">
            <h3 className="text-xl font-semibold">4. Share and explore</h3>
            <p className="mt-3 text-muted">
              If you make an idea shareable, you can send it to others. Explore public community submissions from the dashboard if you want inspiration.
            </p>
          </article>

          <article className="glass-card rounded-[2rem] bg-surface p-8">
            <h3 className="text-xl font-semibold">5. Tips for beginners</h3>
            <ul className="mt-3 space-y-3 text-muted">
              <li>Keep titles clear and concise.</li>
              <li>Use tags or categories to organize your ideas.</li>
              <li>Capture supporting media when it helps explain the idea.</li>
              <li>Verify text whenever you want proof of originality.</li>
            </ul>
          </article>
        </section>
      </main>
    </div>
  );
}
