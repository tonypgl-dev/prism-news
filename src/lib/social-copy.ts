import Anthropic from "@anthropic-ai/sdk";
import type { ClusterRow } from "@/types";
import { isBlindspot } from "@/lib/utils";

function getAnthropic(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

function rowToContext(row: ClusterRow): string {
  const parts: string[] = [];
  for (const bias of ["left", "center", "right"] as const) {
    const a = row[bias];
    if (a) {
      parts.push(`[${bias}] ${a.source?.name ?? "?"}: ${a.title}`);
    }
  }
  return parts.join("\n");
}

export async function generateFacebookPostCopy(row: ClusterRow): Promise<string> {
  const client = getAnthropic();
  const ctx = rowToContext(row);
  const blind = isBlindspot(row);

  if (!client) {
    const main = row.left ?? row.center ?? row.right;
    const t = main?.title ?? "Știre";
    return blind
      ? `🔎 ${t}\n\n⚠️ Subiect cu acoperire slabă pe spectrul editorial.\n\nCitește perspectivele pe Prisma News →`
      : `🔎 ${t}\n\nCitește perspectivele pe Prisma News →`;
  }

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: `Scrie textul unei postări Facebook în română pentru un agregator neutru de știri (Prisma News).
Reguli:
- Ton informativ, fără senzaționalism.
- Max 900 caractere.
- Include emoji discret la început (ex. un singur 🔎 sau 📰).
- Rezumă subiectul în 2-4 propoziții pe baza titlurilor.
- Dacă există doar o singură tabără editorială (stânga/centru/dreapta), menționează scurt că lipsesc alte perspective (fără acuzații).
- Încheie cu o linie: "Citește toate perspectivele →" (fără URL în text; linkul va fi separat).

Context titluri:
${ctx}
${blind ? "\n(NOTĂ: cluster cu blindspot — o parte a spectrului lipsește.)" : ""}

Răspunde DOAR cu textul postării, fără ghilimele.`,
      },
    ],
  });

  const block = message.content.find((b) => b.type === "text");
  const text = block && block.type === "text" ? block.text.trim() : "";
  return text || "Citește perspectivele pe Prisma News →";
}

export function pickRowImageUrl(row: ClusterRow): string | null {
  return (
    row.left?.image_url ||
    row.center?.image_url ||
    row.right?.image_url ||
    null
  );
}

export function pickRowLink(row: ClusterRow, siteBase: string): string {
  const main = row.left ?? row.center ?? row.right;
  if (main?.link) return main.link;
  const base = siteBase.replace(/\/$/, "");
  return `${base}/?cluster=${encodeURIComponent(row.cluster_id)}`;
}
