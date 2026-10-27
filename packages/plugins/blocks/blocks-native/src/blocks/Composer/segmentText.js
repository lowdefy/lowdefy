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

// How a segment reads in the input: a mention as "@Name", text as it is.
export function displayOf(segment) {
  return segment.kind === 'mention' ? `@${segment.name}` : segment.text;
}

/** The text the input shows for the segments. */
export function toDisplay(segments) {
  return segments.map(displayOf).join('');
}

/** The markdown value of the segments: each mention as its token in `format`. */
export function toValue({ segments, format }) {
  return segments
    .map((segment) =>
      segment.kind === 'mention' ? format.replace('{id}', segment.id) : segment.text
    )
    .join('');
}

/**
 * The segments as units the cursor steps over: one per character of text, one per mention, each
 * with its offset in the shown text.
 */
export function toAtoms(segments) {
  const atoms = [];
  let offset = 0;
  segments.forEach((segment) => {
    if (segment.kind === 'mention') {
      const length = displayOf(segment).length;
      atoms.push({ segment, start: offset, end: offset + length });
      offset += length;
      return;
    }
    for (const char of segment.text) {
      atoms.push({ char, start: offset, end: offset + char.length });
      offset += char.length;
    }
  });
  return atoms;
}

/** Segments back from atoms (or { char } and { segment } units), adjacent text joined. */
export function fromAtoms(atoms) {
  const segments = [];
  atoms.forEach((atom) => {
    if (atom.segment) {
      segments.push(atom.segment);
      return;
    }
    const lastSegment = segments[segments.length - 1];
    if (lastSegment?.kind === 'text') {
      lastSegment.text += atom.char;
      return;
    }
    segments.push({ kind: 'text', text: atom.char });
  });
  return segments;
}

/** Characters of `text` as units for fromAtoms. */
export function charsOf(text) {
  return [...text].map((char) => ({ char }));
}
