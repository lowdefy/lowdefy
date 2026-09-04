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

const MAX_UNCOVERED_LINES = 40;

function groupByPage({ uncovered }) {
  const pages = new Map();
  uncovered.forEach((triple) => {
    if (!pages.has(triple.pageId)) pages.set(triple.pageId, []);
    pages.get(triple.pageId).push(triple);
  });
  // Ranked by page: the page with the most unexercised config first, because
  // that is where the next journey buys the most.
  return [...pages.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
}

function describe({ blockId, event }) {
  return event === 'request' ? `request ${blockId}` : `${blockId} ${event}`;
}

// The number is the share of *declared* config a journey exercises, so the
// header says "static" every time - a reader who takes it for a share of real
// user interaction will over-trust it.
function formatJourneyCoverage({ coverage }) {
  const percent = Math.round(coverage.share * 1000) / 10;
  const lines = [
    `Journey coverage (static, declared config): ${coverage.covered}/${coverage.total} triples, ${percent}%`,
  ];
  if (coverage.total === 0) {
    lines.push('  No block events or page requests are declared.');
    return lines;
  }
  if (coverage.uncovered.length === 0) {
    return lines;
  }
  const ranked = groupByPage({ uncovered: coverage.uncovered });
  let printed = 0;
  for (const [pageId, triples] of ranked) {
    if (printed >= MAX_UNCOVERED_LINES) break;
    lines.push(`  ${pageId} (${triples.length} uncovered)`);
    for (const triple of triples) {
      if (printed >= MAX_UNCOVERED_LINES) break;
      lines.push(`    ${describe(triple)}`);
      printed += 1;
    }
  }
  const remaining = coverage.uncovered.length - printed;
  if (remaining > 0) {
    lines.push(`  ... and ${remaining} more.`);
  }
  return lines;
}

export default formatJourneyCoverage;
