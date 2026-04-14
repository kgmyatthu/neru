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
    subhead: 'Designed for 1.69× campaign unit multiplier — artillery, cavalry, and infantry rebalanced',
    content: React.createElement('div', { className: 'art-text-flow' },
      React.createElement('p', null,
        React.createElement('span', { className: 'drop-cap' }, 'B'),
        React.createElement('span', { className: 'first-word' }, 'uilt'),
        ' on NER\'s ballistic model, designed for 1.69× unit multiplier. At this scale the base game\'s balancing breaks down, so artillery, cavalry, and infantry have been rebalanced.'
      ),
      React.createElement(InlineFigure, {
        src: 'images/artillery.png',
        alt: 'French battery of artillery showing 8 guns deployed',
        caption: 'French Battery of Artillery, 4-lber Artillerie à Pied — 8 guns.',
        float: 'left',
      }),
      React.createElement('p', null,
        React.createElement('strong', null, 'Artillery'),
        ' — 6–8 guns per battery. Canister projectile count doubled vs vanilla (~50–60 per volley), with spread and range adjusted to keep it deadly at close range without being overpowered at distance.'
      ),
      React.createElement('p', null,
        React.createElement('strong', null, 'Cavalry'),
        ' — troop sizes increased to match the larger unit scale. The game engine disables square formation for any infantry unit above 400 men — at 1.69× most line infantry sits right at that threshold (~400), the highest it can go while retaining the ability to form square. This restores one of the period\'s defining tactical interactions: cavalry must respect infantry that has time to form square, just as it did on historical battlefields. Frontal charges into a prepared square are suicidal, and even a well-timed charge against infantry in line is costly if the battalion is fresh and deep-ranked. Cavalry remains most effective on flanks, against routers, and when catching infantry mid-manoeuvre before a square can form.'
      ),
      React.createElement(InlineFigure, {
        src: 'images/rank-spacing.jpg',
        alt: 'Infantry battalions advancing with increased rank spacing',
        caption: 'Infantry advancing with increased rank spacing.',
        float: 'right',
      }),
      React.createElement('p', null,
        React.createElement('strong', null, 'Rank Spacing'),
        ' — vertical spacing between infantry ranks has been increased to reflect historical drill manuals. Formations look more authentic and interact more naturally with musket fire and artillery.'
      ),
      React.createElement('p', null,
        'Combined with NER\'s ballistic trajectories, these changes produce large-scale battles that maintain tactical balance between all three arms.'
      ),
    ),
  },

  // ─── Article II: Vanilla Overhaul Assets ──────────────────
  {
    articleLabel: 'Article II',
    headline: 'Vanilla Overhaul Assets',
    subhead: 'Assets included as-is, with manual table reconciliation for NER compatibility',
    content: React.createElement('div', { className: 'art-text-cols' },
      React.createElement('p', null,
        React.createElement('span', { className: 'drop-cap' }, 'T'),
        React.createElement('span', { className: 'first-word' }, 'his'),
        ' mod includes several asset categories from the Vanilla Overhaul mod. The original files are used as-is — however, manual database table reconciliation was required to make them compatible with NER\'s modified unit tables, stats, and structure. All visual and audio assets remain the work of the Vanilla Overhaul team.'
      ),
      React.createElement('p', null,
        React.createElement('strong', null, 'Unit Reskins'),
        ' — all faction uniforms and unit models are Vanilla Overhaul\'s textures, covering everything from line infantry facings to hussar braiding and grenadier equipment. Sharper detail and period-accurate appearance across the board.'
      ),
      React.createElement('p', null,
        React.createElement('strong', null, 'Sound Effects'),
        ' — musket reports, cannon fire, and ambient battlefield audio are replaced with Vanilla Overhaul\'s SFX pack, giving gunfire a deeper, more percussive character.'
      ),
      React.createElement('p', null,
        React.createElement('strong', null, 'Visual Effects'),
        ' — powder smoke, muzzle flash, and cannon impact effects come from Vanilla Overhaul\'s VFX pack. Smoke lingers and drifts more naturally, and combat feels more atmospheric.'
      ),
      React.createElement('p', null,
        React.createElement('strong', null, 'Historical Flags'),
        ' — regimental and national colours across all factions are Vanilla Overhaul\'s flag textures. French Imperial Eagles, British regimental standards, Prussian, Austrian, and Russian colours — all historically accurate, visible on the campaign map and in battle.'
      ),
      React.createElement('p', null,
        'These assets are bundled into a single install so players get the complete audiovisual overhaul alongside the gameplay changes without needing to track down and install each component separately.'
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
        React.createElement('figcaption', null, 'Standard bearer raising the flag upright during a march.'),
      ),
      React.createElement('div', { className: 'art-text-cols' },
        React.createElement('p', null,
          React.createElement('span', { className: 'drop-cap' }, 'T'),
          React.createElement('span', { className: 'first-word' }, 'wo'),
          ' minor animation changes have been added to the mod. The first is a standard bearer animation — flag carriers now raise their flag to a more upright position when the unit is marching, and lower it when standing idle. This is visible in the GIF above.'
        ),
        React.createElement('p', null,
          'The second addition is a sabre riding charge animation for cavalry, where troopers wave their sabres during a charge. This animation was extracted and ported from the Vanilla Enhanced mod.'
        ),
        React.createElement('p', null,
          'Both animation files are sourced as-is from their original mods, with manual table reconciliation performed to integrate them into NER\'s database structure. These are the only two animation changes in the mod — everything else uses the base game\'s default animations.'
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
        ' card descriptions across all factions have been updated to reflect proper Napoleonic military terminology — replacing the generic labels used throughout the base game\'s interface. Each branch of the army now carries its correct designation.'
      ),
      React.createElement(InlineFigure, {
        src: 'images/unit-infantry.png',
        alt: 'Infanterie de Ligne — Line Infantry Battalion',
        caption: 'Infanterie de Ligne designated as "Line Infantry Battalion"',
        float: 'left',
      }),
      React.createElement('p', null,
        'Infantry formations are now designated as ',
        React.createElement('strong', null, 'battalions'),
        ', the standard tactical unit of Napoleonic foot soldiers. A battalion typically comprised several hundred men organised into companies, and it was this formation — not the regiment — that manoeuvred and fought as a single body on the field of battle.'
      ),
      React.createElement(InlineFigure, {
        src: 'images/unit-cavalry.png',
        alt: 'Cuirassiers — Squadron of Heavy Cavalry',
        caption: 'Cuirassiers designated as "Squadron of Heavy Cavalry"',
        float: 'right',
      }),
      React.createElement('p', null,
        'Cavalry units are now labelled as ',
        React.createElement('strong', null, 'squadrons'),
        ', reflecting the organisational reality of mounted troops in this period. The squadron was the basic manoeuvre element for cavalry of all types — from the heavy cuirassiers shown here to light hussars and dragoons.'
      ),
      React.createElement(InlineFigure, {
        src: 'images/unit-artillery.png',
        alt: '4-lber Artillerie à Pied — Battery of Artillery',
        caption: '4-lber Artillerie à Pied designated as "Battery of Artillery"',
        float: 'left',
      }),
      React.createElement('p', null,
        'Artillery is now correctly designated as a ',
        React.createElement('strong', null, 'battery'),
        ' — the standard grouping of guns that operated together under a single commander. This change complements the gun count correction in Article I, completing the artillery overhaul.'
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
        React.createElement('span', { className: 'drop-cap' }, 'C'),
        React.createElement('span', { className: 'first-word' }, 'ampaign'),
        ' battle maps have been set to their maximum possible size using terrain templates ported from Sirlion\'s Battleterrain mod. In the base game, auto-generated maps default to conservative sizes that feel cramped at larger unit scales. Sirlion\'s work pushed the templates to the engine\'s hard-coded 3×3 km limit, reworking deployment zones and terrain features for each battle type.'
      ),
      React.createElement(InlineFigure, {
        src: 'images/battlemap.jpg',
        alt: 'Large scale battle with 30+ units deployed',
        caption: 'A full-scale engagement on a maximised campaign battle map with 30+ units per side.',
        float: 'left',
        width: '68%',
      }),
      React.createElement('p', null,
        'This is critical for the mod\'s intended 1.69× unit multiplier. At that scale, default maps leave almost no room between deployment zones, and large 55–60 unit armies end up stacked on top of each other. The maximised maps give formations the space to deploy properly and fight as they would on a real Napoleonic battlefield.'
      ),
      React.createElement('p', null,
        React.createElement('strong', null, 'AI Battle Formations'),
        ' — the AI\'s formation logic has been adjusted to better handle 55–60 unit armies. The base game\'s AI was not designed for armies this large and tends to clump units together or leave flanks exposed.'
      ),
      React.createElement('p', null,
        'The changes aim to help the AI distribute units more evenly across the deployment zone and increase the likelihood of cavalry being placed on the flanks. There is also a higher probability of the AI attempting flanking manoeuvres with both cavalry and infantry. That said, results are mixed — the AI still struggles with complex terrain and can behave unpredictably depending on the player\'s own formation choices. It\'s an improvement over the default behaviour, not a fix.'
      ),
      React.createElement('p', null,
        React.createElement('strong', null, '60-Unit UI'),
        ' — to support 55–60 unit full-stack armies, a custom 60-unit UI has been built through intensive reverse engineering of the game\'s interface files. Campaign, battle, and pre-battle screens all display the full 60 unit cards at studio quality. This is entirely new work — not extracted from any existing mod — and replaces the base game\'s default unit card panel, which was never designed to handle armies of this size.'
      ),
      React.createElement('p', null,
        'The terrain templates are included as-is from Sirlion\'s original work. The AI formation changes are custom to this mod.'
      ),
    ),
  },
];
