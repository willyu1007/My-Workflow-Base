"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { EntityRow } from "./entity-row.js";

export type SelectionListProps = Readonly<{
  label: string;
  items: readonly Readonly<{ id: string; title: ReactNode; summary?: string; disabled?: boolean }>[];
  selectedId: string | null;
  selectedIds?: readonly string[];
  maxVisibleRows?: number;
  onSelect: (id: string) => void;
  toolbar?: Readonly<{ filter: ReactNode; accessory?: ReactNode; expanded?: boolean }>;
  appearance?: "framed" | "plain";
  empty: ReactNode;
}>;

/** A controlled choice pane. Moving focus never selects or writes a consumer value. */
export function SelectionList({ label, items, selectedId, selectedIds, maxVisibleRows, onSelect, toolbar, appearance = "framed", empty }: SelectionListProps) {
  const options = useRef(new Map<string, HTMLDivElement>());
  const list = useRef<HTMLDivElement>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const isSelected = (id: string) => selectedIds ? selectedIds.includes(id) : id === selectedId;
  const enabled = items.filter(item => !item.disabled);
  const entry = enabled.find(item => item.id === focusedId)
    ?? enabled.find(item => isSelected(item.id)) ?? enabled[0];
  const entryId = entry?.id;

  useEffect(() => {
    const active = document.activeElement;
    if (active === list.current && entryId !== undefined) {
      options.current.get(entryId)?.focus();
      return;
    }
    if (focusedId === null || items.some(item => item.id === focusedId && !item.disabled)) return;
    // Recover only a focus that this pane owned, never a toolbar or external input.
    if (!list.current?.contains(active) && active !== document.body) return;
    if (entryId !== undefined) options.current.get(entryId)?.focus();
    else { list.current?.focus(); setFocusedId(null); }
  }, [entryId, focusedId, items]);

  const keyDown = (event: KeyboardEvent<HTMLDivElement>, id: string) => {
    const index = enabled.findIndex(item => item.id === id);
    if (index < 0) return;
    let next: number;
    switch (event.key) {
      case "ArrowDown": next = Math.min(index + 1, enabled.length - 1); break;
      case "ArrowUp": next = Math.max(index - 1, 0); break;
      case "Home": next = 0; break;
      case "End": next = enabled.length - 1; break;
      case "Enter":
      case " ":
        event.preventDefault();
        event.stopPropagation();
        onSelect(id);
        return;
      default: return;
    }
    event.preventDefault();
    event.stopPropagation();
    const item = enabled[next];
    if (item) options.current.get(item.id)?.focus();
  };

  return <div className={`wb-selection wb-selection--${appearance}${selectedIds ? " wb-selection--multiple" : ""}`}>
    {toolbar && <div className={`wb-selection__bar${toolbar.expanded ? " wb-selection__bar--expanded" : ""}`}>
      {!toolbar.expanded && <>{toolbar.filter}<span className="wb-selection__divider" aria-hidden="true" /></>}
      {toolbar.accessory}
    </div>}
    <div ref={list} className={`wb-selection__rows${maxVisibleRows ? " wb-selection__rows--bounded" : ""}`}
      style={maxVisibleRows ? {maxHeight: `calc(${maxVisibleRows} * 38.5px + 2 * var(--sp-1))`} : undefined} role="listbox" aria-label={label} aria-multiselectable={selectedIds ? true : undefined}
      tabIndex={enabled.length === 0 ? 0 : -1}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocusedId(null); }}>
      {items.length === 0 ? <div className="wb-selection__empty">{empty}</div> : items.map(item => <div
        key={item.id} role="option" aria-selected={isSelected(item.id)} aria-disabled={item.disabled || undefined}
        tabIndex={entry?.id === item.id ? 0 : -1} className="wb-selection__option"
        ref={node => { if (node) options.current.set(item.id, node); else options.current.delete(item.id); }}
        onFocus={() => setFocusedId(item.id)}
        onKeyDown={event => keyDown(event, item.id)}
        onClick={() => { if (!item.disabled) onSelect(item.id); }}>
        <EntityRow model={{ title: item.title, ...(selectedIds ? {leading: <input className="wb-selection__check" type="checkbox" checked={isSelected(item.id)} tabIndex={-1} aria-hidden="true" readOnly disabled={item.disabled}/>} : {}), ...(item.summary === undefined ? {} : {
          trailing: <span className="wb-selection__summary" title={item.summary}>{item.summary}</span>,
        }) }} />
      </div>)}
    </div>
  </div>;
}
