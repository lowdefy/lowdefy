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

// Turns one or more enriched feedback batches (after enrichFeedback.js has
// attached `annotation.location`) into a single agent-readable text block.
// The overlay copies this text to the developer's clipboard — they paste it
// into their agent session. Kept as a pure string formatter — no
// build-artifact access.
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

  if (batch.screenshotPath) {
    lines.push('');
    lines.push(
      `Annotated screenshot: ${batch.screenshotPath} (read this image to see the drawings)`
    );
  }

  lines.push('');
  lines.push(
    `For the page's live state call lowdefy_inspect_state({ pageId: "${batch.pageId}" }).`
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
  if (location.source && location.resolvedVia) {
    return `generated at runtime — defined via ancestor "${location.resolvedVia}": ${location.source}`;
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
