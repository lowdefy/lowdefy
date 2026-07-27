/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

/**
 * The document's visual vocabulary — sizes, colours, and the two builders both
 * translators share. `toPdfMake` maps IR `heading`/`divider` nodes through
 * these, and `markdownToPdfMake` maps mdast headings and thematic breaks
 * through the same builders, so a markdown `## Section` and a Title block at
 * level 2 render identically ("one correct way": one definition, not two that
 * drift).
 */

/** Heading font sizes by level. Levels beyond 4 clamp to 4. */
export const HEADING_SIZES = { 1: 22, 2: 17, 3: 14, 4: 12 };

export const MUTED = '#8c8c8c';
export const RULE_COLOR = '#d9d9d9';
export const HEADER_FILL = '#f5f5f5';

/** Heading styling (no text): bold, sized by level, standard heading margins. */
export function headingStyle(level) {
  return {
    fontSize: HEADING_SIZES[level] ?? HEADING_SIZES[4],
    bold: true,
    margin: [0, 8, 0, 4],
  };
}

/** A heading. `text` may be a string or an array of pdfmake text items. */
export function headingContent({ text, level }) {
  return { text, ...headingStyle(level) };
}

/** A horizontal rule drawn the full content width. */
export function dividerContent(contentWidth) {
  return {
    margin: [0, 4, 0, 8],
    canvas: [
      {
        type: 'line',
        x1: 0,
        y1: 0,
        x2: contentWidth,
        y2: 0,
        lineWidth: 0.5,
        lineColor: RULE_COLOR,
      },
    ],
  };
}
