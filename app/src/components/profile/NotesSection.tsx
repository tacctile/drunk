"use client";

import { useEffect, useRef, useState } from "react";
import { useVoterNotes } from "@/hooks/useVoterNotes";
import { Icon } from "@/components/Icon";

export function NotesSection({ voterId }: { voterId: string }) {
  const { notes, loading, addNote, deleteNote } = useVoterNotes(voterId);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (deleteTimer.current) clearTimeout(deleteTimer.current);
    };
  }, []);

  const handleAdd = async (content: string) => {
    await addNote(voterId, content);
    setDraft("");
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    await deleteNote(id);
    setDeletingId(null);
  };

  const startDelete = (id: string) => {
    setDeletingId(id);
    if (deleteTimer.current) clearTimeout(deleteTimer.current);
    deleteTimer.current = setTimeout(() => setDeletingId(null), 2000);
  };

  const charCount = draft.length;
  const canSave = charCount > 0 && charCount <= 280;

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-title text-ink">About me</h2>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex h-11 w-11 items-center justify-center text-accent"
          aria-label="Add note"
        >
          <Icon name="add_circle" size={24} />
        </button>
      </div>

      {adding && (
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            className="input min-h-[80px] resize-none"
            placeholder="Write something about yourself..."
            maxLength={280}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
          />
          <p className="text-right text-meta text-ink-dim">{charCount} / 280</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setDraft("");
                setAdding(false);
              }}
              className="flex h-11 items-center text-base text-ink-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSave}
              onClick={() => void handleAdd(draft)}
              className="btn-accent flex-1"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {!loading && notes.length === 0 && !adding && (
        <p className="mt-2 text-base text-ink-dim">No notes yet</p>
      )}

      <div className="mt-3 flex flex-col gap-3">
        {notes.map((note) => (
          <div key={note.id} className="card relative">
            <p className="text-base text-ink" style={{ wordBreak: "break-word" }}>
              {note.content}
            </p>
            <p className="mt-1 text-meta text-ink-dim">
              {new Date(note.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <div className="absolute right-2 top-2">
              {deletingId === note.id ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void handleDelete(note.id)}
                    className="text-meta font-semibold text-red"
                  >
                    Delete?
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingId(null)}
                    className="flex h-11 w-11 items-center justify-center text-ink-dim"
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => startDelete(note.id)}
                  className="flex h-11 w-11 items-center justify-center text-ink-dim"
                  aria-label="Delete note"
                >
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
