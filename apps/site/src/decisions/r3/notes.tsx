import { MATCHES } from './Editor';

export const D10R2_NOTE = (
  <>
    Every scene draws the editor sample's own source, tokenizer, find matches and diff (examples/editor/data.ts), lines 9
    to 22, with a multi-line selection that runs over a find match, the current line, a bracket pair, and an error and a
    warning squiggle. The sample's find for "items" has {MATCHES.length} matches here, not 9; the fourth is current, as in
    the sample. K, S and F scenes carry the D10-C channels; X scenes are drawn on today's rendering so each shows only what
    it adds. Bands are eight-digit literals computed at render from level data. The grid crosses every token with every
    band, including pairs the snippet never draws. Greyscale is a CSS grayscale filter.
  </>
);

export const D11_NOTE = (
  <>
    Rows use eight hand-set issues with 1, 2 and 3 labels. Seven labels share five hues, so colour cannot carry label
    identity on its own; the text has to. Ink density is a computed estimate (stated beside each figure): geometry from
    the board's CSS and glyph coverage per character calibrated from the real font. The inbox and DataTable scenes use the
    package Table and DataTable; the kanban card's chrome is simplified.
  </>
);
