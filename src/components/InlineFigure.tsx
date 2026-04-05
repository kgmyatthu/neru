/**
 * @component InlineFigure
 * Renders a floatable image with caption within article text flow.
 * Used inside article content to embed screenshots that text wraps around.
 *
 * @example
 * ```tsx
 * <InlineFigure
 *   src="images/artillery.png"
 *   alt="Artillery battery"
 *   caption="8 guns deployed in formation."
 *   float="left"
 * />
 * ```
 */

import type { InlineFigureProps } from '@/types';

export function InlineFigure({ src, alt, caption, float = 'left', width }: InlineFigureProps) {
  const className = `art-inline-fig${float === 'right' ? ' right' : ''}`;
  const style = width ? { width } : undefined;

  return (
    <figure className={className} style={style}>
      <div className="art-fig-img">
        <img src={src} alt={alt} />
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
