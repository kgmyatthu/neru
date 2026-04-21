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
        ' — cavalry now reflects period doctrine. Heavy cavalry (cuirassiers, carabiniers) wielded the straight-bladed pallasch — a thrusting weapon built for the shock of the charge and poorly suited to parry or prolonged mêlée. Light cavalry (hussars, chasseurs) carry the curved sabre, a true cut-and-guard weapon that excels in sustained combat. Melee values, charge bonuses, and movement speed have been reworked accordingly: heavy squadrons deliver a devastating initial impact but falter once pinned, while light squadrons engage more effectively beyond the initial shock — trading mass for manoeuvre.'
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

  // ─── Article II: Campaign Rework & AI Formations ──────────
  {
    articleLabel: 'Article II',
    headline: 'Campaign Rework & AI Formations',
    subhead: 'An economy sized for corps-strength warfare, with AI tuned for 55–60 unit armies',
    content: React.createElement('div', { className: 'art-text-flow' },
      React.createElement(InlineFigure, {
        src: 'images/60ui-prebattle.jpg',
        alt: '60-unit UI on the pre-battle screen showing both armies',
        caption: 'Pre-battle — 60 unit cards for both forces.',
        float: 'right',
        width: '55%',
      }),
      React.createElement('p', null,
        React.createElement('span', { className: 'drop-cap' }, 'T'),
        React.createElement('span', { className: 'first-word' }, 'he'),
        ' campaign is designed around 60-unit armies — roughly 20,000 men per stack. Four to five full stacks engaged in a single theatre therefore approach 100,000 troops, in keeping with the manpower historically fielded by the Great Powers of the Napoleonic era. The engine itself cannot host forces of that magnitude on a single battlefield; in practice, battles are fought as one full stack per side, with an additional stack committing as reinforcement as the engagement develops — a scale that still far exceeds the token armies of the default game. The campaign economy has been reworked from the ground up to sustain this reality: recruitment costs, upkeep, faction income, and manpower generation are all tuned to support protracted operations at corps strength.'
      ),
      React.createElement('p', null,
        'A 60-unit army may read as attritional on paper, but recruitment itself imposes the tempo of the war: raising a full stack from scratch takes on the order of fourteen turns, and fielding it alongside a faction\'s other wartime commitments is a real logistical problem. Catching a rival at full strength therefore rewards manoeuvre and decisive battle over mediocre, inconclusive victories — and because replacing a full stack army takes ten or more turns regardless of treasury, two or three such engagements are typically enough to knock a major power out of the war entirely. It is also not unusual for a single catastrophic field defeat to bring the enemy to the peace table on the following turn.'
      ),
      React.createElement('p', null,
        'NER\'s morale system rewards that same decisive impulse. A routed battalion can still be left with considerable manpower; unless actively pursued and cut down — classically the work of cavalry — a broken army reorganises and returns to the line in subsequent battles. Sitting idle while a defeated force withdraws squanders the victory outright. This rewards an operational style recognisably Napoleon\'s own: contemporary accounts repeatedly describe his preference for the decisive battle followed by vigorous pursuit, and a player campaigning without sufficient cavalry will feel the corresponding absence.'
      ),
      React.createElement(InlineFigure, {
        src: 'images/60ui-battle.jpg',
        alt: '60-unit UI on the battle deployment screen',
        caption: 'Battle — full 60-unit card panel.',
        float: 'left',
        width: '55%',
      }),
      React.createElement('p', null,
        React.createElement('strong', null, 'AI Formations'),
        ' — tuned for 55–60 unit armies. Improved unit distribution across the line, cavalry held on the flanks, and more frequent flanking attempts during engagement. A meaningful improvement over default behaviour rather than a complete overhaul.'
      ),
      React.createElement(InlineFigure, {
        src: 'images/60ui-campaign.jpg',
        alt: '60-unit UI on the campaign map',
        caption: 'Campaign — 60 unit cards in the bottom panel.',
        float: 'right',
        width: '55%',
      }),
      React.createElement('p', null,
        React.createElement('strong', null, '60-Unit UI'),
        ' — custom-built through intensive reverse engineering of the game\'s interface. Campaign, battle, and pre-battle screens now display all sixty unit cards at studio quality. Entirely original work — not extracted from any existing mod — and essential to keeping a 60-unit army legible in practice.'
      ),
    ),
  },

  // ─── Article III: Unit Designations ───────────────────────
  {
    articleLabel: 'Article III',
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
        ' — the tactical unit that manoeuvred and fought as a single body. Establishment strength for a Napoleonic battalion typically ran from 800 to 1,000 men, though attrition from disease, desertion, and detached duty routinely reduced an active-campaign battalion to roughly 500 effectives — closer to the figure actually fielded on any given day.'
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
        ' — the basic tactical unit of mounted troops in the 18th and early 19th centuries. A Napoleonic cavalry squadron (French: ',
        React.createElement('em', null, 'escadron'),
        ') typically comprised two companies and fielded between 100 and 200 sabres, depending on nation, establishment, and campaign wastage. Four squadrons generally formed a regiment in French service; British cavalry followed a similar pattern with two troops to a squadron. As the mounted counterpart of the infantry battalion, the squadron was the smallest body able to manoeuvre and deliver a coordinated charge under a single set of colours, with its own officers, standard, and trumpet calls.'
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
        ' — the tactical grouping of guns commanded by a captain and served by its own gunners, drivers, and ammunition train. A standard Napoleonic foot battery fielded six to eight pieces — a mix of cannon and howitzers, the howitzers providing the high-angle, shell-throwing complement to the flat-trajectory guns. Horse artillery batteries followed the same establishment with lighter pieces and mounted crews, enabling them to keep pace with cavalry on manoeuvre and redeploy under fire.'
      ),
    ),
  },

  // ─── Article IV: Maximised Battle Maps ────────────────────
  {
    articleLabel: 'Article IV',
    headline: 'Maximised Battle Maps',
    subhead: 'Engagement space extended to the engine\'s 3×3 km ceiling',
    content: React.createElement('div', { className: 'art-text-flow' },
      React.createElement('p', null,
        React.createElement('span', { className: 'drop-cap' }, 'B'),
        React.createElement('span', { className: 'first-word' }, 'attle'),
        ' maps have been extended to the engine\'s maximum 3×3 km footprint using Sirlion\'s Battleterrain templates. Default terrain is far too constrained for the 55–60 unit armies this mod is built around; maximised maps give formations the lateral frontage and reserve depth required to deploy, manoeuvre, and commit reserves in the period manner.'
      ),
      React.createElement(InlineFigure, {
        src: 'images/battlemap.jpg',
        alt: 'Large scale battle with 55+ units deployed',
        caption: 'Full-scale engagement on a maximised 3×3 km battle map.',
        float: 'left',
        width: '68%',
      }),
    ),
  },

  // ─── Article V: Vanilla Overhaul Assets ───────────────────
  {
    articleLabel: 'Article V',
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
        ' — detailed faction uniforms and unit models. ',
        React.createElement('strong', null, 'Sound Effects'),
        ' — deeper, more percussive musket and cannon audio. ',
        React.createElement('strong', null, 'Visual Effects'),
        ' — lingering powder smoke, natural muzzle flash and impact effects. ',
        React.createElement('strong', null, 'Historical Flags'),
        ' — accurate regimental and national colours for all factions.'
      ),
    ),
  },

  // ─── Article VI: Animations ───────────────────────────────
  {
    articleLabel: 'Article VI',
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
];
