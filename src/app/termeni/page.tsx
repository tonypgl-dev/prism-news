import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { LegalMarkdown } from "@/components/LegalMarkdown";
import { getLegalMarkdown } from "@/lib/legal-docs";

export const metadata = {
  title: "Termeni și condiții · Prisma News",
  description: "Termenii și condițiile de utilizare Prisma News.",
};

export default function TermeniPage() {
  const content = getLegalMarkdown("termeni-si-conditii.md");

  return (
    <>
      <Header sticky={false} />
      <main className="flex-1 w-full px-4 sm:px-6 py-8 pb-16">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft size={13} aria-hidden />
            Înapoi la Home
          </Link>
          <LegalMarkdown content={content} />
        </div>
      </main>
    </>
  );
}
