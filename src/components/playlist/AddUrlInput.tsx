"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Link as LinkIcon, X } from "lucide-react";
import type { ParseResponse } from "@/lib/types";

interface AddUrlInputProps {
  onParsed: (result: ParseResponse) => void;
}

export function AddUrlInput({ onParsed }: AddUrlInputProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Failed to parse" }));
        throw new Error(data.error);
      }

      const data: ParseResponse = await res.json();
      onParsed(data);
      setUrl("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse URL");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <LinkIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="url"
            placeholder="YouTube 영상 URL을 붙여넣으세요"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            className="pl-9 pr-8"
            disabled={loading}
          />
          {url && (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <Button type="submit" disabled={!url.trim() || loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Add"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
