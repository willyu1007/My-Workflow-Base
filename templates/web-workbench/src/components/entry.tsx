/**
 * EntryFrame — pre-shell gate chrome. Outside AppShell and the six Scene
 * paradigms. Domain-agnostic: the kit locks the navy canvas, brand row, and
 * slots; the scenario supplies scene label, copy, actions, and any accessory.
 */
import type { ReactNode } from "react";
import { IconAlert } from "./icons.js";

export function EntryFrame({
  scene,
  brand = "MORETHAN",
  accessory,
  children,
}: {
  readonly scene: string;
  readonly brand?: string;
  readonly accessory?: ReactNode;
  readonly children: ReactNode;
}): React.ReactElement {
  return (
    <main className="wb-entry">
      <div className="wb-entry__chrome">
        <p className="wb-entry__brand">
          <span className="wb-entry__wordmark">{brand}</span>
          <span className="wb-entry__sep" aria-hidden="true">
            |
          </span>
          <span className="wb-entry__scene">{scene}</span>
        </p>
        {accessory ? <div className="wb-entry__accessory-slot">{accessory}</div> : null}
      </div>
      <div className="wb-entry__body">{children}</div>
    </main>
  );
}

export function EntryHeading({
  aside,
  children,
}: {
  readonly aside?: ReactNode;
  readonly children: ReactNode;
}): React.ReactElement {
  return (
    <div className="wb-entry__head">
      <h1 className="wb-entry__title">{children}</h1>
      {aside ? <p className="wb-entry__aside">{aside}</p> : null}
    </div>
  );
}

export function EntryNotice({
  children,
}: {
  readonly children: ReactNode;
}): React.ReactElement {
  return (
    <p className="wb-entry__notice" role="status">
      {children}
    </p>
  );
}

export function EntryCopy({
  children,
}: {
  readonly children: ReactNode;
}): React.ReactElement {
  return <p className="wb-entry__copy">{children}</p>;
}

export function EntryAlert({
  children,
}: {
  readonly children: ReactNode;
}): React.ReactElement {
  return (
    <div className="wb-entry__alert">
      <IconAlert size={18} />
      <h1 className="wb-entry__title">{children}</h1>
    </div>
  );
}

export function EntryActions({
  children,
}: {
  readonly children: ReactNode;
}): React.ReactElement {
  return <div className="wb-entry__actions">{children}</div>;
}

export function EntrySubmit({
  kind = "accent",
  href,
  type = "submit",
  disabled,
  children,
  form,
  name,
  value,
  onClick,
}: {
  readonly kind?: "accent" | "ghost" | "quiet";
  readonly href?: string;
  readonly type?: "submit" | "button";
  readonly disabled?: boolean;
  readonly children: ReactNode;
  readonly form?: string;
  readonly name?: string;
  readonly value?: string;
  readonly onClick?: () => void;
}): React.ReactElement {
  const className = `wb-entry__action wb-entry__action--${kind}`;
  if (href && !disabled) {
    return (
      <a className={className} href={href}>
        {children}
      </a>
    );
  }
  return (
    <button
      type={type}
      className={className}
      disabled={disabled}
      form={form}
      name={name}
      value={value}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function EntryChoice({
  mark,
  title,
  caption,
  actionLabel,
  type = "submit",
  name,
  value,
  disabled,
}: {
  readonly mark?: string;
  readonly title: string;
  readonly caption?: string;
  readonly actionLabel: string;
  readonly type?: "submit" | "button";
  readonly name?: string;
  readonly value?: string;
  readonly disabled?: boolean;
}): React.ReactElement {
  return (
    <button
      type={type}
      className="wb-entry__choice"
      name={name}
      value={value}
      disabled={disabled}
    >
      <span className="wb-entry__mark" aria-hidden="true">
        {mark ?? title.slice(0, 1)}
      </span>
      <span className="wb-entry__choice-copy">
        <strong>{title}</strong>
        {caption ? <small>{caption}</small> : null}
      </span>
      <em>{actionLabel}</em>
    </button>
  );
}

export function EntryChoices({
  children,
}: {
  readonly children: ReactNode;
}): React.ReactElement {
  return <div className="wb-entry__choices">{children}</div>;
}

export function EntryQuiet({
  children,
}: {
  readonly children: ReactNode;
}): React.ReactElement {
  return <div className="wb-entry__quiet">{children}</div>;
}

export function EntryAccessory({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}): React.ReactElement {
  return (
    <details className="wb-entry__accessory">
      <summary>{label}</summary>
      <div className="wb-entry__accessory-panel">{children}</div>
    </details>
  );
}
