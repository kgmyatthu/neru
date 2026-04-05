/**
 * @component NewspaperMasthead
 * Renders the newspaper-style masthead bar at the top of content pages.
 * Displays the mod name in blackletter, an article label, and a section tag.
 *
 * @example
 * ```tsx
 * <NewspaperMasthead label="Article I" section="Features" />
 * ```
 */

interface NewspaperMastheadProps {
  /** Article number label (e.g., "Article I"). Optional for utility pages. */
  label?: string;
  /** Right-aligned section tag (e.g., "Features"). */
  section?: string;
  /** Mod name override. Defaults to "Napoleon Empire Realism Ultimate". */
  modName?: string;
}

export function NewspaperMasthead({
  label,
  section,
  modName = 'Napoleon Empire Realism Ultimate',
}: NewspaperMastheadProps) {
  return (
    <>
      <div className="art-masthead">
        <span className="name">{modName}</span>
        {label && <span className="label">{label}</span>}
        {section && <span className="date">{section}</span>}
      </div>
      <div className="art-thin-rule" />
    </>
  );
}
