import Link from "next/link";
import LegalLinks from "@/components/LegalLinks";

export default function LegalPageLayout({ title, description, children }) {
  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:py-12">
      <main className="mx-auto max-w-3xl">
        <header className="mb-8">
          <Link href="/login" className="text-sm text-primary underline underline-offset-4">
            Back to Originly
          </Link>
          <p className="mt-6 text-sm uppercase tracking-[0.25em] text-muted">NagTech Labs · Draft for review</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-4 leading-7 text-muted">{description}</p>
          <p className="mt-3 text-sm text-muted">Last updated: October 17, 2026</p>
        </header>

        <aside className="mb-8 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          These are working drafts based on the app as currently implemented, not legal advice. NagTech Labs should
          confirm the service details and have these documents reviewed for applicable Philippine and other laws
          before treating them as final.
        </aside>

        <article className="section-card space-y-8 leading-7 text-foreground">
          {children}
        </article>

        <footer className="mt-8 space-y-4 text-center text-sm text-muted">
          <p>
            Questions or requests? Email{" "}
            <a className="underline underline-offset-4" href="mailto:thomasadriannaguit@gmail.com">
              thomasadriannaguit@gmail.com
            </a>{" "}
            or{" "}
            <a className="underline underline-offset-4" href="mailto:tomtonjon@yahoo.com">
              tomtonjon@yahoo.com
            </a>
            .
          </p>
          <LegalLinks />
        </footer>
      </main>
    </div>
  );
}
