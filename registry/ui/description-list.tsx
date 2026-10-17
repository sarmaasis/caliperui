"use client";

import { Pencil } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "./button";
import { CopyButton } from "./copy-button";
import { Input } from "./input";
import { cn } from "./lib/cn";
import "./description-list.css";

export type DescriptionItem = {
  /** The label, e.g. "Region". */
  term: string;
  /** What is shown. Leave empty for "Not set". */
  value?: ReactNode;
  /** Set in mono with tabular figures: IDs, keys, amounts. */
  mono?: boolean;
  /** Adds a copy button for this text, e.g. an ID. */
  copy?: string;
  /** A short note under the value, e.g. "Changed 2 days ago". */
  hint?: ReactNode;
  /** Makes the value editable in place. `onSave` may return a promise; a thrown error keeps the draft and shows the message. */
  edit?: { value: string; onSave: (value: string) => void | Promise<void>; type?: "text" | "email" | "url" | "number"; placeholder?: string };
};

/**
 * A record's details as label and value pairs: side by side when there is
 * room, stacked on a phone. Values can be copied or edited where they sit,
 * empty ones say so, and a loading record keeps its shape.
 */
export function DescriptionList({
  items,
  columns = 1,
  loading = false,
  title,
  className,
}: {
  items: readonly DescriptionItem[];
  /** Two pairs per row on wide containers. */
  columns?: 1 | 2;
  loading?: boolean;
  /** A small heading over the list, e.g. "Billing details". */
  title?: string;
  className?: string;
}) {
  const titleId = useId();
  return (
    <section data-slot="description-list" data-columns={columns} aria-labelledby={title ? titleId : undefined} aria-busy={loading || undefined} className={cn("@container min-w-0", className)}>
      {title && <h3 id={titleId} className="mb-2 text-sm font-semibold">{title}</h3>}
      <dl>
        {items.map((item) => (
          <div key={item.term} data-slot="description-row">
            <dt>{item.term}</dt>
            <dd>{loading ? <span data-slot="description-skeleton" aria-hidden="true" /> : <Value item={item} />}</dd>
          </div>
        ))}
      </dl>
      {loading && <span className="sr-only">Loading details</span>}
    </section>
  );
}

function Value({ item }: { item: DescriptionItem }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.edit?.value ?? "");
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const field = useRef<HTMLInputElement>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const restore = useRef(false);
  const errorId = useId();

  useEffect(() => {
    if (editing) field.current?.select();
    else if (restore.current) {
      restore.current = false;
      editButton.current?.focus();
    }
  }, [editing]);

  async function save() {
    if (!item.edit) return;
    if (draft === item.edit.value) return close();
    setSaving(true);
    setError(undefined);
    try {
      await item.edit.onSave(draft);
      close();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "That could not be saved. Try again.");
      requestAnimationFrame(() => field.current?.focus());
    } finally {
      setSaving(false);
    }
  }

  function close() {
    restore.current = true;
    setError(undefined);
    setEditing(false);
  }

  if (editing && item.edit) {
    return (
      <form
        data-slot="description-edit"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <Input
          ref={field}
          aria-label={item.term}
          type={item.edit.type ?? "text"}
          value={draft}
          placeholder={item.edit.placeholder}
          disabled={saving}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              close();
            }
          }}
          className="h-8"
        />
        <div className="flex gap-1.5">
          <Button type="submit" size="sm" loading={saving}>Save</Button>
          <Button size="sm" variant="ghost" onClick={close} disabled={saving}>Cancel</Button>
        </div>
        {error && <p id={errorId} role="alert" className="basis-full text-xs text-destructive">{error}</p>}
      </form>
    );
  }

  const empty = item.value === undefined || item.value === null || item.value === "";
  return (
    <div data-slot="description-value">
      <div className="grid min-w-0 gap-0.5">
        <span data-mono={item.mono || undefined} data-empty={empty || undefined} className="min-w-0 [overflow-wrap:anywhere]">
          {empty ? (
            <>
              <span aria-hidden="true">—</span>
              <span className="sr-only">Not set</span>
            </>
          ) : (
            item.value
          )}
        </span>
        {item.hint && <span className="text-xs text-muted-foreground">{item.hint}</span>}
      </div>
      {(item.copy || item.edit) && (
        <span data-slot="description-actions">
          {item.copy && <CopyButton value={item.copy} label={`Copy ${item.term.toLowerCase()}`} iconOnly variant="ghost" />}
          {item.edit && (
            <Button
              ref={editButton}
              variant="ghost"
              size="icon"
              aria-label={`Edit ${item.term.toLowerCase()}`}
              className="size-8"
              onClick={() => {
                setDraft(item.edit!.value);
                setEditing(true);
              }}
            >
              <Pencil aria-hidden="true" />
            </Button>
          )}
        </span>
      )}
    </div>
  );
}
