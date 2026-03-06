import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface WhisperHistoryItem {
  id: string;
  text: string;
  selectedCount: number;
  lastSelectedAt: string;
}

interface UseWhisperResult {
  history: WhisperHistoryItem[];
  getSuggestions: (input: string) => string[];
  recordSelection: (text: string) => Promise<void>;
  isLoading: boolean;
}

export function useWhisper(userId: string | null): UseWhisperResult {
  const [history, setHistory] = useState<WhisperHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;
    setIsLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from('whisper_history')
          .select('id, text, selected_count, last_selected_at')
          .eq('user_id', userId)
          .order('selected_count', { ascending: false })
          .order('last_selected_at', { ascending: false })
          .limit(50);

        if (!isMounted) return;
        if (error) {
          console.warn('[useWhisper] fetch error:', error);
          return;
        }
        setHistory(
          (data ?? []).map((r) => ({
            id: r.id,
            text: r.text,
            selectedCount: r.selected_count,
            lastSelectedAt: r.last_selected_at,
          })),
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [userId]);

  const getSuggestions = useCallback(
    (input: string): string[] => {
      if (!input.trim()) return [];
      const lower = input.toLowerCase();
      return history
        .filter((h) => h.text.toLowerCase().includes(lower))
        .slice(0, 5)
        .map((h) => h.text);
    },
    [history],
  );

  const recordSelection = useCallback(
    async (text: string) => {
      if (!userId || !text.trim()) return;

      const existing = history.find(
        (h) => h.text.toLowerCase() === text.toLowerCase().trim(),
      );

      if (existing) {
        const newCount = existing.selectedCount + 1;
        const now = new Date().toISOString();
        const { error } = await supabase
          .from('whisper_history')
          .update({ selected_count: newCount, last_selected_at: now })
          .eq('id', existing.id);

        if (!error) {
          setHistory((prev) =>
            prev
              .map((h) =>
                h.id === existing.id
                  ? { ...h, selectedCount: newCount, lastSelectedAt: now }
                  : h,
              )
              .sort((a, b) => b.selectedCount - a.selectedCount),
          );
        }
      } else {
        const { data, error } = await supabase
          .from('whisper_history')
          .insert({ user_id: userId, text: text.trim(), selected_count: 1 })
          .select('id, text, selected_count, last_selected_at')
          .single();

        if (!error && data) {
          setHistory((prev) => [
            {
              id: data.id,
              text: data.text,
              selectedCount: data.selected_count,
              lastSelectedAt: data.last_selected_at,
            },
            ...prev,
          ]);
        }
      }
    },
    [userId, history],
  );

  return { history, getSuggestions, recordSelection, isLoading };
}
