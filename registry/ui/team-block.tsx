import { BlockHeader, BlockInitials, BlockRoot, BlockTitle } from "./block-concept";

export type BlockPerson = {
  name: string;
  role: string;
  /** What they are responsible for, e.g. "owns the matching engine". */
  owns: string;
  /** mailto, tel or a profile link. */
  contact?: { label: string; href: string };
};

/**
 * People introduced by what they own and how to reach them: a masthead with
 * names at display size. Initials fill in for photos.
 */
export function TeamBlock({
  eyebrow,
  title,
  lead,
  people,
  footnote,
  className,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  people: readonly BlockPerson[];
  footnote?: string;
  className?: string;
}) {
  const note = footnote && <p className="mt-8 text-sm text-[var(--k-muted)]">{footnote}</p>;

  return (
    <BlockRoot className={className}>
      <BlockHeader eyebrow={eyebrow} title={title} lead={lead} align="split" />
      <ul className="border-b border-[var(--k-line)]">
        {people.map((person, index) => (
          <li key={person.name} className="group grid items-center gap-x-6 gap-y-1 border-t border-[var(--k-line)] py-[clamp(18px,2.4cqi,28px)] @[720px]:grid-cols-[56px_minmax(0,1.2fr)_minmax(0,1.2fr)_auto]">
            <BlockInitials name={person.name} size={48} tone={index} className="@max-[719px]:hidden" />
            <BlockTitle as="h3" size={3} className="!text-[clamp(24px,3cqi,36px)]">{person.name}</BlockTitle>
            <span className="text-[15px] text-[var(--k-muted)]">{person.role} · {person.owns}</span>
            {person.contact && <a href={person.contact.href} className="justify-self-start font-mono text-[13px] underline-offset-4 hover:text-[var(--k-hi)] hover:underline @[720px]:justify-self-end">{person.contact.label}</a>}
          </li>
        ))}
      </ul>
      {note}
    </BlockRoot>
  );
}
