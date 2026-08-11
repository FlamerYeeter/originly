"use client";

import CaptureForm from "@/components/CaptureForm";
import Link from "next/link";

export default function CapturePage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <main className="container-max mx-auto px-4">
        <div className="section-header mb-8">
          <div>
            <h1 className="heading-1">Capture new idea</h1>
            <p className="lead">Record a new idea and save it to your vault.</p>
          </div>
          <Link href="/dashboard" className="btn-outline">
            Back to dashboard
          </Link>
        </div>

        <div className="section-card">
          <CaptureForm />
        </div>
      </main>
    </div>
  );
}
