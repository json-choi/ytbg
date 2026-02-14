"use client";

import { useState, useEffect, useCallback } from "react";
import { getHistory, clearHistory as dbClearHistory } from "../db";
import type { HistoryEntry } from "../types";

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await getHistory();
    setEntries(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const clearAll = useCallback(async () => {
    await dbClearHistory();
    setEntries([]);
  }, []);

  return { entries, loading, refresh, clearAll };
}
