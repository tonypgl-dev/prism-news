"use client";

import { useCallback, useEffect, useState } from "react";
import type { ClusterRow } from "@/types";

const STORAGE_KEY = "prism-social-admin-token";

type SocialPost = {
  id: string;
  cluster_id: string | null;
  content: string;
  image_url: string | null;
  link: string | null;
  status: string;
  scheduled_at: string | null;
  fb_post_id: string | null;
  created_at: string;
  published_at: string | null;
};

export function AdminPostsClient() {
  const [token, setToken] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<ClusterRow[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [autopilot, setAutopilot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, Partial<SocialPost>>>({});

  useEffect(() => {
    try {
      const t = sessionStorage.getItem(STORAGE_KEY);
      if (t) setSaved(t);
    } catch {
      /* ignore */
    }
  }, []);

  const authHeaders = useCallback(() => {
    const t = saved || token;
    return {
      Authorization: `Bearer ${t}`,
      "Content-Type": "application/json",
    };
  }, [saved, token]);

  const loadAll = useCallback(async () => {
    const t = saved || token;
    if (!t.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      const [cRes, qRes, sRes] = await Promise.all([
        fetch("/api/social/candidates", { headers: authHeaders() }),
        fetch("/api/social/queue", { headers: authHeaders() }),
        fetch("/api/social/settings", { headers: authHeaders() }),
      ]);
      if (!cRes.ok) throw new Error(await cRes.text());
      if (!qRes.ok) throw new Error(await qRes.text());
      const cJson = await cRes.json();
      const qJson = await qRes.json();
      setCandidates(cJson.rows ?? []);
      setPosts(qJson.posts ?? []);
      if (sRes.ok) {
        const sJson = await sRes.json();
        setAutopilot(!!sJson.autopilot);
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Eroare încărcare");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, saved, token]);

  useEffect(() => {
    if (saved) void loadAll();
  }, [saved, loadAll]);

  function persistToken() {
    const t = token.trim();
    if (!t) return;
    sessionStorage.setItem(STORAGE_KEY, t);
    setSaved(t);
    void loadAll();
  }

  function logout() {
    sessionStorage.removeItem(STORAGE_KEY);
    setSaved(null);
    setToken("");
    setCandidates([]);
    setPosts([]);
  }

  async function generateDraft(clusterId: string) {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/social/generate", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ cluster_id: clusterId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || res.statusText);
      setMsg("Draft creat.");
      await loadAll();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Eroare");
    } finally {
      setLoading(false);
    }
  }

  async function toggleAutopilot(next: boolean) {
    setLoading(true);
    try {
      const res = await fetch("/api/social/settings", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ autopilot: next }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || res.statusText);
      setAutopilot(next);
      setMsg(next ? "Auto-pilot activ." : "Auto-pilot oprit.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Eroare setări");
    } finally {
      setLoading(false);
    }
  }

  async function savePost(id: string) {
    const patch = { ...edits[id] };
    if (!patch || Object.keys(patch).length === 0) return;
    if (patch.scheduled_at && !patch.status) patch.status = "scheduled";
    if (patch.scheduled_at === null) patch.status = "draft";
    setLoading(true);
    try {
      const res = await fetch(`/api/social/posts/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(patch),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || res.statusText);
      setEdits((e) => {
        const n = { ...e };
        delete n[id];
        return n;
      });
      setMsg("Salvat.");
      await loadAll();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Eroare");
    } finally {
      setLoading(false);
    }
  }

  async function publishNow(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/social/posts/${id}/publish`, {
        method: "POST",
        headers: authHeaders(),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || res.statusText);
      setMsg(`Publicat. ID Facebook: ${j.fb_post_id ?? "—"}`);
      await loadAll();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Eroare publicare");
    } finally {
      setLoading(false);
    }
  }

  async function removePost(id: string) {
    if (!confirm("Ștergi acest draft?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/social/posts/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(await res.text());
      await loadAll();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Eroare");
    } finally {
      setLoading(false);
    }
  }

  function rowTitle(row: ClusterRow) {
    return row.left?.title || row.center?.title || row.right?.title || "(fără titlu)";
  }

  function perspectiveCount(row: ClusterRow) {
    return [row.left, row.center, row.right].filter(Boolean).length;
  }

  if (!saved) {
    return (
      <div className="max-w-md mx-auto mt-16 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-sm">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Admin · Postări sociale
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Introdu parola setată în <code className="text-xs">SOCIAL_ADMIN_SECRET</code> (din
          .env.local).
        </p>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm mb-3"
          placeholder="Parolă"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={persistToken}
          className="w-full py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-500"
        >
          Intră
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Postări Facebook
        </h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={autopilot}
              disabled={loading}
              onChange={(e) => void toggleAutopilot(e.target.checked)}
            />
            Auto-pilot (cron + tabel social_settings)
          </label>
          <button
            type="button"
            onClick={() => void loadAll()}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600"
          >
            Reîncarcă
          </button>
          <button
            type="button"
            onClick={logout}
            className="text-sm text-red-600 dark:text-red-400"
          >
            Ieșire
          </button>
        </div>
      </div>

      {msg && (
        <p className="mb-4 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
          {msg}
        </p>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">
            Clustere recente (7 zile)
          </h2>
          <ul className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {candidates.map((row) => (
              <li
                key={row.cluster_id}
                className="rounded-xl border border-gray-200 dark:border-gray-800 p-3 bg-white/80 dark:bg-gray-900/80"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                  {rowTitle(row)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {perspectiveCount(row)} perspective · {row.cluster_id.slice(0, 8)}…
                </p>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void generateDraft(row.cluster_id)}
                  className="mt-2 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Generează draft
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">
            Coadă &amp; drafturi
          </h2>
          <ul className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {posts.map((p) => {
              const e = edits[p.id] ?? {};
              const content = e.content ?? p.content;
              const scheduled = e.scheduled_at ?? p.scheduled_at ?? "";
              const localScheduled =
                scheduled && !Number.isNaN(Date.parse(scheduled))
                  ? new Date(scheduled).toISOString().slice(0, 16)
                  : "";

              return (
                <li
                  key={p.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white/80 dark:bg-gray-900/80"
                >
                  <div className="flex justify-between gap-2 mb-2">
                    <span className="text-xs font-bold uppercase text-gray-500">
                      {p.status}
                    </span>
                    {p.fb_post_id && (
                      <span className="text-xs text-gray-400">FB {p.fb_post_id}</span>
                    )}
                  </div>
                  <textarea
                    value={content}
                    onChange={(ev) =>
                      setEdits((prev) => ({
                        ...prev,
                        [p.id]: { ...prev[p.id], content: ev.target.value },
                      }))
                    }
                    rows={5}
                    className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 p-2 mb-2"
                  />
                  <div className="flex flex-wrap gap-2 items-center text-xs">
                    <label className="flex items-center gap-1 text-gray-500">
                      Programat (local):
                      <input
                        type="datetime-local"
                        value={localScheduled}
                        onChange={(ev) => {
                          const v = ev.target.value;
                          const iso = v ? new Date(v).toISOString() : null;
                          setEdits((prev) => ({
                            ...prev,
                            [p.id]: {
                              ...prev[p.id],
                              scheduled_at: iso,
                              status: iso ? "scheduled" : prev[p.id]?.status ?? p.status,
                            },
                          }));
                        }}
                        className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 px-1"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      type="button"
                      disabled={loading || p.status === "published"}
                      onClick={() => void savePost(p.id)}
                      className="px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-800 text-xs font-semibold"
                    >
                      Salvează modificări
                    </button>
                    <button
                      type="button"
                      disabled={loading || p.status === "published"}
                      onClick={() => void publishNow(p.id)}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold"
                    >
                      Publică acum
                    </button>
                    <button
                      type="button"
                      disabled={loading || p.status === "published"}
                      onClick={() => void removePost(p.id)}
                      className="px-3 py-1.5 rounded-lg text-red-600 text-xs font-semibold"
                    >
                      Șterge
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <p className="mt-10 text-xs text-gray-500 dark:text-gray-600">
        Cron: <code className="text-[11px]">GET /api/cron/social-due</code> cu{" "}
        <code className="text-[11px]">Authorization: Bearer CRON_SECRET</code> publică postările
        programate. <code className="text-[11px]">GET /api/cron/social-autopilot</code> generează
        drafturi dacă auto-pilot e activ.
      </p>
    </div>
  );
}
