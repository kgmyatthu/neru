# Napoleon Empire Realism Ultimate — Mod Website

A newspaper-themed mod showcase website with horizontal page-turning animation, built with React + TypeScript + Vite.

## Quick Start

```bash
npm install
npm run dev
```

## Page Model

The site is a 5-page newspaper. Each page is assembled in [src/data/pages.ts](src/data/pages.ts):

| # | Page | Source |
| - | ---- | ------ |
| I | Hero (video backdrop, trailer, download CTA) | `pages.ts` |
| II | Features (all articles combined into one broadsheet) | [src/data/articles.tsx](src/data/articles.tsx) |
| III | Download & Installation | [src/data/install.tsx](src/data/install.tsx) |
| IV | Discussion (Giscus / GitHub Discussions) | `pages.ts` |
| V | Credits | [src/data/credits.ts](src/data/credits.ts) |

## Project Structure

```
src/
├── App.tsx                       # Root component — orchestrates everything
├── main.tsx                      # Entry point
├── types/
│   └── index.ts                  # All TypeScript interfaces
├── data/
│   ├── articles.tsx              # ⭐ Article sections — ADD NEW ARTICLES HERE
│   ├── credits.ts                # Credit entries
│   ├── install.tsx               # Installation steps
│   └── pages.ts                  # Page assembler (hero, features, download, etc.)
├── hooks/
│   └── usePageTurn.ts            # Page-turn logic (scroll, touch, keyboard, animation)
├── components/
│   ├── PageShell.tsx             # 3D page wrapper (front/back faces, curl highlight)
│   ├── HeroPage.tsx              # Landing page with YouTube / self-hosted video backdrop
│   ├── FeaturesPage.tsx          # Multi-column broadsheet rendering all articles
│   ├── ArticlePage.tsx           # Reusable article page with masthead + headline
│   ├── DownloadPage.tsx          # Installation instructions + download button
│   ├── DiscussionPage.tsx        # Giscus-powered comments page
│   ├── CreditsPage.tsx           # Acknowledgements with linked contributor names
│   ├── NewspaperMasthead.tsx     # Masthead chrome — horizontal bar on desktop,
│   │                             #   stacked header + fixed bottom tab bar on mobile (<=768px)
│   ├── InlineFigure.tsx          # Floatable image for embedding in article text
│   ├── PageNav.tsx               # Dot indicators at viewport bottom
│   ├── PageArrows.tsx            # Left/right turn buttons
│   └── AudioToggle.tsx           # Mute/unmute button for hero video
└── styles/
    └── global.css                # All styles (18th-century broadsheet theme)
```

## Adding a New Article

Articles are rendered as sections within the single **Features** page — they are not separate pages.

1. Place any images in `public/images/`.

2. Open [src/data/articles.tsx](src/data/articles.tsx) and add a new entry to the `articles` array:

```tsx
{
  articleLabel: 'Article V',
  headline: 'Your Headline',
  subhead: 'Your subhead text',
  content: (
    <div className="art-text-flow">
      <p>
        <span className="drop-cap">F</span>
        <span className="first-word">irst</span>
        {' '}rest of your paragraph...
      </p>
      <p>Second paragraph...</p>
    </div>
  ),
}
```

3. The section automatically appears in the Features broadsheet.

### Article Layout Patterns

**Two-column text** (no images):
```tsx
<div className="art-text-cols">
  <p>Paragraph text...</p>
</div>
```

**Flowing text with embedded images**:
```tsx
<div className="art-text-flow">
  <p>Text before image...</p>
  <InlineFigure
    src="images/screenshot.png"
    alt="Description"
    caption="Caption text"
    float="left"       // or "right"
    width="50%"         // optional
  />
  <p>Text wraps around image...</p>
</div>
```

**Full-width image above text**:
```tsx
<>
  <figure className="art-fig">
    <div className="art-fig-img">
      <img src="images/screenshot.png" alt="Description" />
    </div>
    <figcaption>Caption</figcaption>
  </figure>
  <div className="art-text-cols">
    <p>Text below image...</p>
  </div>
</>
```

## Adding Credits

Open [src/data/credits.ts](src/data/credits.ts) and add an entry:

```ts
{
  name: 'Contributor Name',
  role: 'What they contributed',
  url: 'https://moddb.com/link',  // optional
}
```

## Configuration

All site-wide configuration lives in [src/data/pages.ts](src/data/pages.ts):

- **YouTube video ID** (hero backdrop & trailer) — `youtubeVideoId` / `trailerUrl`
- **Self-hosted backdrop video** — `backdropVideo` (MP4 in `public/videos/`)
- **Download URL** — `downloadUrl` (currently points to Nexus Mods)
- **Giscus setup** (discussion page) — `repo`, `repoId`, `category`, `categoryId`
  - Generate values via [giscus.app](https://giscus.app/)

Other config:
- **Google Analytics ID** — replace `GA_MEASUREMENT_ID` in [index.html](index.html)
- **OG Image URL** — update `og:image` in `index.html` with the absolute URL after deploy

## Responsive Behavior

- **Desktop (>768px)** — classic horizontal masthead, inline nav links.
- **Mobile (≤768px)** — stacked header (monogram + title + date stamp) with a fixed bottom tab bar for page navigation. The dot pagination is hidden on article pages (the tab bar replaces it).
- **Ultrawide / 4K** — root font-size scales up at 2400px / 3200px / 3800px breakpoints so the rem-based type scale grows proportionally.

## Deploy

```bash
npm run build
```

Output lands in `dist/`. The build also copies `index.html` → `404.html` so SPA routing works on GitHub Pages. Deploy to any static host (GitHub Pages, Netlify, Vercel, etc.).

## Image Files

Current assets in `public/images/`:
- `hero-fallback.jpg` — hero backdrop fallback
- `artillery.png`, `rank-spacing.jpg` — large-scale unit article
- `unit-infantry.png`, `unit-cavalry.png`, `unit-artillery.png` — unit rebalance article
- `flag-animation.gif` — flag animation article
- `battlemap.jpg` — battle map article
- `60ui-battle.jpg`, `60ui-campaign.jpg`, `60ui-prebattle.jpg` — 60-unit UI article
