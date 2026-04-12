import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { LegalMarkdown } from "@/components/LegalMarkdown";
import { getLegalMarkdown } from "@/lib/legal-docs";

export const metadata = {
  title: "Politica de confidențialitate · Prisma News",
  description: "Politica de confidențialitate și protecția datelor personale.",
};

export default function ConfidentialitatePage() {
  const content = getLegalMarkdown("politica-confidentialitate.md");

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
