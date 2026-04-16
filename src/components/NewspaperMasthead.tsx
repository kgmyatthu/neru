/**
 * @component NewspaperMasthead
 * Renders the newspaper-style masthead bar at the top of content pages.
 * Displays the mod name (clickable home link), an article label,
 * and right-aligned nav links for page navigation.
 */

const navLinks = [
  { id: 'features', label: 'Features' },
  { id: 'download', label: 'Download' },
  { id: 'discussion', label: 'Discussion' },
  { id: 'credits', label: 'Credits' },
] as const;

interface NewspaperMastheadProps {
  /** Article number label (e.g., "Article I"). Optional for utility pages. */
  label?: string;
  /** ID of the currently active page, used to highlight the active nav link. */
  activePage?: string;
  /** Navigation callback. Receives a page ID (e.g., 'features', 'download'). */
  onNavigate?: (pageId: string) => void;
  /** Mod name override. Defaults to "Napoleon Empire Realism Ultimate". */
  modName?: string;
}

export function NewspaperMasthead({
  label,
  activePage,
  onNavigate,
  modName = 'Napoleon Empire Realism Ultimate',
}: NewspaperMastheadProps) {
  return (
    <>
      <div className="art-masthead">
        <span
          className="name"
          role="button"
          tabIndex={0}
          onClick={() => onNavigate?.('hero')}
          onKeyDown={(e) => { if (e.key === 'Enter') onNavigate?.('hero'); }}
        >
          {modName}
        </span>
        {label && <span className="label">{label}</span>}
        <nav className="masthead-nav">
          {navLinks.map((link, i) => (
            <span key={link.id}>
              {i > 0 && <span className="sep">&middot;</span>}
              <button
                className={`masthead-nav-link${activePage === link.id ? ' active' : ''}`}
                onClick={() => onNavigate?.(link.id)}
              >
                {link.label}
              </button>
            </span>
          ))}
        </nav>
      </div>
      <div className="art-thin-rule" />
    </>
  );
}
