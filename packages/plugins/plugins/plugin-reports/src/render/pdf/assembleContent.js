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

import translateTopNode from './translateTopNode.js';
import unbreakableHeight from './unbreakableHeight.js';

// A heading and a divider introduce what follows, so they travel with it.
const SECTION_MARKERS = new Set(['heading', 'divider']);

// A heading is ~30pt with its margins; used to size a candidate group.
const MARKER_HEIGHT = 30;
// A chart-plus-heading group has to leave room for the rest of the page's flow,
// so only group when the pair takes at most this share of the page.
const GROUP_HEIGHT_LIMIT = 0.9;

/**
 * Assemble the top-level content, keeping each heading with the content it
 * introduces. A chart that does not fit the remaining space moves to the next
 * page whole (it is unbreakable), which used to leave its heading behind above a
 * blank half page. Grouping the pair in one unbreakable stack moves them
 * together.
 *
 * This is done here rather than with pdfmake's `pageBreakBefore` callback: that
 * callback decides from which nodes share a page, and a row whose children
 * overflow still counts as being on the heading's page, so the orphan goes
 * unnoticed. Grouping needs no such bookkeeping.
 *
 * Groups are capped at a share of the page: a heading plus something taller than
 * the page would otherwise become an unbreakable block that cannot be placed.
 */
function assembleContent(nodes, ctx, pageContentHeight) {
  const content = [];
  let markers = [];

  const flushMarkers = () => {
    content.push(...markers);
    markers = [];
  };

  for (const node of nodes) {
    const translated = translateTopNode(node, ctx);
    if (translated === null) continue;

    if (SECTION_MARKERS.has(node.kind)) {
      markers.push(translated);
      continue;
    }

    const height = unbreakableHeight(node);
    const fits =
      height !== undefined &&
      height + markers.length * MARKER_HEIGHT <= pageContentHeight * GROUP_HEIGHT_LIMIT;

    if (markers.length > 0 && fits) {
      // A page break asked for on the first marker belongs to the group.
      const [first, ...rest] = markers;
      const { pageBreak, ...head } = first;
      content.push({
        stack: [head, ...rest, translated],
        unbreakable: true,
        ...(pageBreak !== undefined ? { pageBreak } : {}),
      });
      markers = [];
      continue;
    }

    flushMarkers();
    content.push(translated);
  }

  flushMarkers();
  return content;
}

export default assembleContent;
