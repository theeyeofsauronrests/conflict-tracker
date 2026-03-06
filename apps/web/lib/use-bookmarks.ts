"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const BOOKMARKS_KEY = "ct-bookmarks-v1";

function loadBookmarkIds(): Set<string> {
  try {
    const raw = window.localStorage.getItem(BOOKMARKS_KEY);
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set<string>();
    return new Set(parsed.filter((value): value is string => typeof value === "string" && value.length > 0));
  } catch {
    return new Set<string>();
  }
}

function persistBookmarkIds(values: Set<string>): void {
  try {
    window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(Array.from(values)));
  } catch {
    // Ignore storage failures and keep in-memory state.
  }
}

export function useBookmarks() {
  const [bookmarkIds, setBookmarkIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setBookmarkIds(loadBookmarkIds());
    setReady(true);
  }, []);

  const toggleBookmark = useCallback((eventKey: string) => {
    setBookmarkIds((current) => {
      const next = new Set(current);
      if (next.has(eventKey)) next.delete(eventKey);
      else next.add(eventKey);
      persistBookmarkIds(next);
      return next;
    });
  }, []);

  const isBookmarked = useCallback((eventKey: string) => bookmarkIds.has(eventKey), [bookmarkIds]);

  const bookmarkCount = useMemo(() => bookmarkIds.size, [bookmarkIds]);

  return {
    ready,
    bookmarkIds,
    bookmarkCount,
    isBookmarked,
    toggleBookmark
  };
}

