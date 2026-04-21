/**
 * @component NewspaperMasthead
 * Renders the newspaper-style masthead chrome for content pages.
 *
 * Desktop (>768px): a single horizontal bar with the mod name, page label,
 * and inline nav links.
 *
 * Mobile (<=768px): a stacked header (monogram + title + date stamp) with
 * dual rules, plus a fixed bottom tab-bar for page navigation. CSS handles
 * the switch; both layouts render in the DOM and the irrelevant one is
 * hidden via the 768px breakpoint.
 */

const navLinks = [
  { id: 'features', label: 'Features', numeral: 'I' },
  { id: 'download', label: 'Download', numeral: 'II' },
  { id: 'discussion', label: 'Discussion', numeral: 'III' },
  { id: 'credits', label: 'Credits', numeral: 'IV' },
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
  /** Shorter name used by the mobile header so it stays on one line. */
  modNameMobile?: string;
}

export function NewspaperMasthead({
  label,
  activePage,
  onNavigate,
  modName = 'Napoleon Empire Realism Ultimate',
  modNameMobile = 'Napoleon Empire R. Ultimate',
}: NewspaperMastheadProps) {
  return (
    <>
      {/* ===== Desktop masthead ===== */}
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

      {/* ===== Mobile masthead — top header ===== */}
      <div className="art-masthead-mobile">
        <div className="mm-row">
          <span
            className="mm-monogram"
            role="button"
            tabIndex={0}
            aria-label="Home"
            onClick={() => onNavigate?.('hero')}
            onKeyDown={(e) => { if (e.key === 'Enter') onNavigate?.('hero'); }}
          >
            N
          </span>
          <div className="mm-title">
            <div className="mm-title-name">{modNameMobile}</div>
            {label && <div className="mm-title-label">{label}</div>}
          </div>
          <div className="mm-date">
            <div>Vol. I</div>
            <div>Apr. 2026</div>
          </div>
        </div>
        <div className="mm-rule-thick" />
        <div className="mm-rule-thin" />
      </div>

      {/* ===== Mobile masthead — fixed bottom nav ===== */}
      <nav className="mm-bottom-nav" aria-label="Page navigation">
        {navLinks.map((link) => (
          <button
            key={link.id}
            className={`mm-tab${activePage === link.id ? ' active' : ''}`}
            onClick={() => onNavigate?.(link.id)}
            aria-current={activePage === link.id ? 'page' : undefined}
          >
            <span className="mm-tab-num">{link.numeral}</span>
            <span className="mm-tab-label">{link.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
