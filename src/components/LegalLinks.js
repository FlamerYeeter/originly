import Link from "next/link";

export default function LegalLinks({ className = "" }) {
  return (
    <nav aria-label="Legal" className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm ${className}`}>
      <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
        Privacy Policy
      </Link>
      <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
        Terms of Service
      </Link>
    </nav>
  );
}
