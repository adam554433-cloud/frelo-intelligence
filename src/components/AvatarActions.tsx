"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Trash2, Download, Loader2, Wand2 } from "lucide-react";

export function AvatarActions({ avatarId, avatarStatus }: { avatarId: number; avatarStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleArchive() {
    setLoading("archive");
    try {
      const action = avatarStatus === "active" ? "archive" : "activate";
      await fetch(`/api/avatars/${avatarId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this avatar permanently? This cannot be undone.")) return;
    setLoading("delete");
    try {
      await fetch(`/api/avatars/${avatarId}`, { method: "DELETE" });
      router.push("/avatars");
    } finally {
      setLoading(null);
    }
  }

  const creativeHubUrl = `https://ai-studio-vert-delta.vercel.app/import-brief?avatar_id=${avatarId}`;

  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <a
        href={creativeHubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-card bg-accent-gradient px-5 py-2.5 font-medium text-chocolate active:opacity-80"
      >
        <Wand2 className="h-4 w-4" />
        Open in Creative Hub
      </a>
      <a
        href={`/api/avatars/export?id=${avatarId}`}
        className="inline-flex items-center gap-2 rounded-card border border-surface-border px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-hover"
      >
        <Download className="h-4 w-4" />
        Export JSON
      </a>
      <button
        onClick={handleArchive}
        disabled={loading !== null}
        className="inline-flex items-center gap-2 rounded-card border border-surface-border px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-hover disabled:opacity-40"
      >
        {loading === "archive" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
        {avatarStatus === "active" ? "Archive" : "Activate"}
      </button>
      <button
        onClick={handleDelete}
        disabled={loading !== null}
        className="inline-flex items-center gap-2 rounded-card border border-danger/30 px-4 py-2.5 text-sm text-danger transition-colors hover:bg-danger/10 disabled:opacity-40"
      >
        {loading === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        Delete
      </button>
    </div>
  );
}
