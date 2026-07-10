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

import { type } from '@lowdefy/helpers';

const MAX_CONSOLE_ENTRIES = 10;

// Turns one or more enriched feedback batches (feedbackStore.consumeAll /
// peek, after enrichFeedback.js has attached `annotation.location`) into a
// single agent-readable text block. Kept as a pure string formatter — no
// build-artifact or store access — so both the Stop hook GET route and any
// future MCP tool can call it on whatever items they already have in hand.
function formatFeedback({ items }) {
  if (type.isNone(items) || items.length === 0) {
    return 'No pending feedback. The developer has not submitted any annotations yet.';
  }
  return items.map(formatBatch).join('\n\n---\n\n');
}

function formatBatch(batch) {
  const viewport = batch.viewport ?? {};
  const lines = [
    `Feedback: ${batch.annotations?.length ?? 0} annotation(s) on page "${batch.pageId}" ` +
      `(${batch.url ?? 'unknown url'}) — viewport ${viewport.width}x${viewport.height} ` +
      `@${viewport.dpr ?? 1}x, scrollY ${viewport.scrollY ?? 0}`,
    '',
  ];

  (batch.annotations ?? []).forEach((annotation, index) => {
    lines.push(formatAnnotation({ annotation, index }));
  });

  if (batch.console?.length > 0) {
    lines.push('');
    lines.push(`Console (${Math.min(batch.console.length, MAX_CONSOLE_ENTRIES)} shown):`);
    batch.console.slice(0, MAX_CONSOLE_ENTRIES).forEach((entry) => {
      lines.push(`  ${entry.level.toUpperCase()}: ${entry.text}`);
    });
  }

  lines.push('');
  lines.push(
    `The developer drew this on their LIVE tab. Call lowdefy_inspect_state({ pageId: "${batch.pageId}" }) ` +
      'for its current state. For a visual, call lowdefy_screenshot_page({ pageId, clip: {…}, scrollX, ' +
      "scrollY }) using an annotation's geometry — note headless recapture may not reproduce live tab state."
  );

  return lines.join('\n');
}

function formatAnnotation({ annotation, index }) {
  const lines = [];
  const num = index + 1;
  const locationText = formatLocation(annotation.location);

  if (annotation.kind === 'element' && annotation.target) {
    const header = locationText
      ? `${num}. Element "${annotation.target.blockId}" (${locationText})`
      : `${num}. Element "${annotation.target.blockId}"`;
    lines.push(header);
    if (annotation.target.ancestorBlockIds?.length > 0) {
      lines.push(`   Ancestors: ${annotation.target.ancestorBlockIds.join(' > ')}`);
    }
    if (annotation.target.tag) {
      const text = annotation.target.text ? ` "${annotation.target.text}"` : '';
      lines.push(`   Tag: ${annotation.target.tag}${text}`);
    }
  } else {
    lines.push(`${num}. Region`);
  }

  lines.push(`   Comment: ${annotation.comment}`);

  const shapesSummary = summarizeShapes({
    shapes: annotation.geometry?.shapes,
    hasElementRect: !type.isNone(annotation.geometry?.elementRect),
  });
  if (shapesSummary) {
    lines.push(`   Shapes: ${shapesSummary}`);
  }

  return lines.join('\n');
}

function formatLocation(location) {
  if (type.isNone(location)) {
    return null;
  }
  return location.source ?? location.note ?? null;
}

// Counts shapes by type (rect/arrow/freehand) preserving first-seen order,
// e.g. "1 rect around the element, 1 arrow" — the first counted type is
// attributed to the targeted element when the annotation carries an
// elementRect, since that is the shape drawn to select it.
function summarizeShapes({ shapes, hasElementRect }) {
  if (!shapes || shapes.length === 0) {
    return null;
  }
  const counts = new Map();
  shapes.forEach((shape) => {
    counts.set(shape.type, (counts.get(shape.type) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([shapeType, shapeCount], index) => {
      const label = `${shapeCount} ${shapeType}${shapeCount > 1 ? 's' : ''}`;
      return index === 0 && hasElementRect ? `${label} around the element` : label;
    })
    .join(', ');
}

export default formatFeedback;
