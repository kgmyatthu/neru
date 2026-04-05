# Napoleon Empire Realism Ultimate — Mod Website

A newspaper-themed mod showcase website with horizontal page-turning animation, built with React + TypeScript + Vite.

## Quick Start

```bash
npm install
npm run dev
```

## Project Structure

```
src/
├── types/
│   └── index.ts              # All TypeScript interfaces and type definitions
├── data/
│   ├── articles.tsx           # ⭐ Article content — ADD NEW ARTICLES HERE
│   ├── credits.ts             # Credit entries — add contributors here
│   ├── install.tsx            # Installation steps data
│   └── pages.ts               # Page assembler (auto-builds from above)
├── hooks/
│   └── usePageTurn.ts         # Page-turn logic (scroll, touch, keyboard, animation)
├── components/
│   ├── App.tsx                # Root component — orchestrates everything
│   ├── PageShell.tsx          # 3D page wrapper (front/back faces, curl highlight)
│   ├── HeroPage.tsx           # Landing page with YouTube video backdrop
│   ├── ArticlePage.tsx        # Reusable article page with masthead + headline
│   ├── DownloadPage.tsx       # Installation instructions + download button
│   ├── CreditsPage.tsx        # Acknowledgements with linked contributor names
│   ├── NewspaperMasthead.tsx   # Blackletter header bar for content pages
│   ├── InlineFigure.tsx       # Floatable image for embedding in article text
│   ├── PageNav.tsx            # Dot indicators at viewport bottom
│   ├── PageArrows.tsx         # Left/right turn buttons
│   └── AudioToggle.tsx        # Mute/unmute button for hero video
├── styles/
│   └── global.css             # All styles (18th-century broadsheet theme)
├── main.tsx                   # Entry point
└── vite-env.d.ts              # Vite type reference
```

## Adding a New Article

1. Place any images in `public/images/`.

2. Open `src/data/articles.tsx` and add a new entry to the `articles` array:

```tsx
{
  articleLabel: 'Article VI',
  headline: 'Your Headline',
  subhead: 'Your subhead text',
  content: (
    <div className="art-text-cols">
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

3. The article automatically appears as a new page. Page numbers auto-increment.

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

Open `src/data/credits.ts` and add an entry:

```ts
{
  name: 'Contributor Name',
  role: 'What they contributed',
  url: 'https://moddb.com/link',  // optional
}
```

## Configuration

- **YouTube Video ID**: Set in `src/data/pages.ts` → `youtubeVideoId`
- **Google Drive Link**: Set in `src/data/pages.ts` → `downloadUrl`
- **Google Analytics ID**: Replace `GA_MEASUREMENT_ID` in `index.html`
- **OG Image URL**: Update `og:image` in `index.html` with absolute URL after deploy

## Deploy

```bash
npm run build
```

Output is in `dist/`. Deploy to any static host (GitHub Pages, Netlify, Vercel, etc.).

## Image Files

Place these in `public/images/`:
- `hero-fallback.jpg` — Hero backdrop fallback
- `artillery.png` — Article I screenshot
- `rank-spacing.jpg` — Article I screenshot
- `unit-infantry.png` — Article IV screenshot
- `unit-cavalry.png` — Article IV screenshot
- `unit-artillery.png` — Article IV screenshot
- `flag-animation.gif` — Article III animation
- `battlemap.jpg` — Article V screenshot
