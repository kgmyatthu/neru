/**
 * @module articles
 * Article page data for the feature showcase section.
 *
 * To add a new article:
 * 1. Add a new entry to the `articles` array below.
 * 2. Place any images in `public/images/`.
 * 3. The article will automatically appear as a new page in the newspaper.
 *
 * Content supports full JSX — use `<InlineFigure>` for embedded images
 * and `<ColumnText>` / `<FlowingText>` for layout variants.
 */

import React from 'react';
import { InlineFigure } from '@/components/InlineFigure';
import type { ArticlePageData } from '@/types';

type ArticleContent = Omit<ArticlePageData, 'type' | 'id' | 'pageNumber' | 'path'>;

/** All feature articles in display order. IDs and page numbers are auto-assigned. */
export const articles: ArticleContent[] = [
  // ─── Article I: NER Large Scale ───────────────────────────
  {
    articleLabel: 'Article I',
    headline: 'NER Adjusted for Large Scale Unit Size',
    subhead: '60-unit armies, ~407 men per line infantry — all arms rebalanced',
    content: React.createElement('div', { className: 'art-text-flow' },
      React.createElement('p', null,
        React.createElement('span', { className: 'drop-cap' }, 'B'),
        React.createElement('span', { className: 'first-word' }, 'uilt'),
        ' on NER\'s ballistic model for 60-unit armies. Each line infantry battalion fields ~407 men — the maximum before the engine disables square formation. Artillery, cavalry, and infantry have been rebalanced for this scale.'
      ),
      React.createElement(InlineFigure, {
        src: 'images/artillery.png',
        alt: 'French battery of artillery showing 8 guns deployed',
        caption: 'French Battery — 8 guns, 4-lber Artillerie à Pied.',
        float: 'left',
      }),
      React.createElement('p', null,
        React.createElement('strong', null, 'Artillery'),
        ' — 6–8 guns per battery with doubled canister (~50–60 per volley). Deadly at close range, tuned to not overpower at distance.'
      ),
      React.createElement('p', null,
        React.createElement('strong', null, 'Cavalry'),
        ' — at ~407 men, infantry retains square formation — the highest possible before the engine disables it. Cavalry must respect prepared squares; charges are most effective on flanks, against routers, or when catching battalions mid-manoeuvre.'
      ),
      React.createElement(InlineFigure, {
        src: 'images/rank-spacing.jpg',
        alt: 'Infantry battalions advancing with increased rank spacing',
        caption: 'Increased rank spacing per historical drill manuals.',
        float: 'right',
      }),
      React.createElement('p', null,
        React.createElement('strong', null, 'Rank Spacing'),
        ' — increased to match historical drill manuals. Formations look authentic and interact naturally with musket fire and artillery.'
      ),
    ),
  },

  // ─── Article II: Vanilla Overhaul Assets ──────────────────
  {
    articleLabel: 'Article II',
    headline: 'Vanilla Overhaul Assets',
    subhead: 'Reskins, flags, SFX & VFX — reconciled with NER tables',
    content: React.createElement('div', { className: 'art-text-cols' },
      React.createElement('p', null,
        React.createElement('span', { className: 'drop-cap' }, 'I'),
        React.createElement('span', { className: 'first-word' }, 'ncludes'),
        ' Vanilla Overhaul\'s visual and audio assets, manually reconciled with NER\'s unit tables. All assets remain the work of the Vanilla Overhaul team.'
      ),
      React.createElement('p', null,
        React.createElement('strong', null, 'Unit Reskins'),
        ' — period-accurate faction uniforms and models. ',
        React.createElement('strong', null, 'Sound Effects'),
        ' — deeper, more percussive musket and cannon audio. ',
        React.createElement('strong', null, 'Visual Effects'),
        ' — lingering powder smoke, natural muzzle flash and impact effects. ',
        React.createElement('strong', null, 'Historical Flags'),
        ' — accurate regimental and national colours for all factions.'
      ),
    ),
  },

  // ─── Article III: Animations ──────────────────────────────
  {
    articleLabel: 'Article III',
    headline: 'Animation Additions',
    subhead: 'Standard bearer flag raise and cavalry sabre charge',
    content: React.createElement(React.Fragment, null,
      React.createElement('figure', { className: 'art-fig', style: { maxWidth: '480px', margin: '0 auto 1rem' } },
        React.createElement('div', { className: 'art-fig-img' },
          React.createElement('img', { src: 'images/flag-animation.gif', alt: 'Standard bearer raising flag while marching' }),
        ),
        React.createElement('figcaption', null, 'Standard bearer raising the flag during a march.'),
      ),
      React.createElement('div', { className: 'art-text-cols' },
        React.createElement('p', null,
          React.createElement('span', { className: 'drop-cap' }, 'T'),
          React.createElement('span', { className: 'first-word' }, 'wo'),
          ' animation additions: standard bearers raise their flag upright when marching, and cavalry troopers wave sabres during charges (ported from Vanilla Enhanced). Both integrated via manual table reconciliation with NER\'s database.'
        ),
      ),
    ),
  },

  // ─── Article IV: Unit Designations ────────────────────────
  {
    articleLabel: 'Article IV',
    headline: 'Corrected Unit Designations',
    subhead: 'Battalion, squadron, and battery — proper Napoleonic terminology',
    content: React.createElement('div', { className: 'art-text-flow' },
      React.createElement('p', null,
        React.createElement('span', { className: 'drop-cap' }, 'U'),
        React.createElement('span', { className: 'first-word' }, 'nit'),
        ' cards across all factions now use proper Napoleonic terminology.'
      ),
      React.createElement(InlineFigure, {
        src: 'images/unit-infantry.png',
        alt: 'Infanterie de Ligne — Line Infantry Battalion',
        caption: '"Line Infantry Battalion"',
        float: 'left',
      }),
      React.createElement('p', null,
        'Infantry are designated as ',
        React.createElement('strong', null, 'battalions'),
        ' — the tactical unit that manoeuvred and fought as a single body.'
      ),
      React.createElement(InlineFigure, {
        src: 'images/unit-cavalry.png',
        alt: 'Cuirassiers — Squadron of Heavy Cavalry',
        caption: '"Squadron of Heavy Cavalry"',
        float: 'right',
      }),
      React.createElement('p', null,
        'Cavalry are labelled as ',
        React.createElement('strong', null, 'squadrons'),
        ' — the basic manoeuvre element for all mounted troops.'
      ),
      React.createElement(InlineFigure, {
        src: 'images/unit-artillery.png',
        alt: '4-lber Artillerie à Pied — Battery of Artillery',
        caption: '"Battery of Artillery"',
        float: 'left',
      }),
      React.createElement('p', null,
        'Artillery designated as a ',
        React.createElement('strong', null, 'battery'),
        ' — a grouping of guns under a single commander.'
      ),
    ),
  },

  // ─── Article V: Battle Maps & AI ──────────────────────────
  {
    articleLabel: 'Article V',
    headline: 'Maximised Battle Maps & AI Formations',
    subhead: 'Larger maps, new AI decision-making for 55–60 unit armies',
    content: React.createElement('div', { className: 'art-text-flow' },
      React.createElement('p', null,
        React.createElement('span', { className: 'drop-cap' }, 'B'),
        React.createElement('span', { className: 'first-word' }, 'attle'),
        ' maps pushed to the engine\'s 3×3 km limit using Sirlion\'s Battleterrain templates. Default maps are far too cramped for 55–60 unit armies — maximised maps give formations room to deploy properly.'
      ),
      React.createElement(InlineFigure, {
        src: 'images/battlemap.jpg',
        alt: 'Large scale battle with 55+ units deployed',
        caption: 'Full-scale engagement on a maximised 3×3 km battle map.',
        float: 'left',
        width: '68%',
      }),
      React.createElement('p', null,
        React.createElement('strong', null, 'AI Formations'),
        ' — adjusted for 55–60 unit armies. Better unit distribution, cavalry on flanks, more flanking attempts. An improvement over default, not a complete fix.'
      ),
      React.createElement(InlineFigure, {
        src: 'images/60ui-prebattle.jpg',
        alt: '60-unit UI on the pre-battle screen showing both armies',
        caption: 'Pre-battle — 60 unit cards for both forces.',
        float: 'right',
        width: '55%',
      }),
      React.createElement('p', null,
        React.createElement('strong', null, '60-Unit UI'),
        ' — custom-built via intensive reverse engineering. Campaign, battle, and pre-battle screens display all 60 unit cards at studio quality. Entirely new work, not extracted from any existing mod.'
      ),
      React.createElement(InlineFigure, {
        src: 'images/60ui-battle.jpg',
        alt: '60-unit UI on the battle deployment screen',
        caption: 'Battle — full 60-unit card panel.',
        float: 'left',
        width: '55%',
      }),
      React.createElement(InlineFigure, {
        src: 'images/60ui-campaign.jpg',
        alt: '60-unit UI on the campaign map',
        caption: 'Campaign — 60 unit cards in the bottom panel.',
        float: 'right',
        width: '55%',
      }),
    ),
  },
];
