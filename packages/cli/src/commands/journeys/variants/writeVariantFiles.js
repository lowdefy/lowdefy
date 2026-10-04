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

import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { type } from '@lowdefy/helpers';

import buildVariantJourney from './buildVariantJourney.js';
import writeVariantHeader, { readVariantHeader } from './writeVariantHeader.js';

function renderVariant({ journey, variant, source }) {
  const document = new YAML.Document(buildVariantJourney({ journey, variant }), {
    aliasDuplicateObjects: false,
  });
  const steps = document.get('steps');
  // One line per step, as journeys are written by hand: `- fill: { blockId: a, value: b }`.
  steps.items.forEach((step) => {
    step.items.forEach((pair) => {
      if (YAML.isCollection(pair.value)) {
        pair.value.flow = true;
      }
    });
  });
  Object.entries(variant.comments ?? {}).forEach(([index, comment]) => {
    steps.items[Number(index)].commentBefore = ` ${comment}`;
  });
  return writeVariantHeader({ source, body: document.toString({ lineWidth: 0 }) });
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Variant files of this journey and these kinds from an earlier run that
// this run did not write: removed when left as generated, else reported.
// A file another journey's run wrote (another source file, or another
// journey of this file) is left alone.
function sweepStale({ directory, stem, source, journey, kinds, written }) {
  const pattern = new RegExp(
    `^${escapeRegExp(stem)}-(${kinds.map(escapeRegExp).join('|')})(-\\d+)?\\.yaml$`
  );
  const results = [];
  fs.readdirSync(directory)
    .filter((name) => pattern.test(name))
    .sort()
    .forEach((name) => {
      const variantPath = path.join(directory, name);
      if (written.has(variantPath)) return;
      const text = fs.readFileSync(variantPath, 'utf8');
      const header = readVariantHeader(text);
      if (type.isNull(header) || header.source !== source) return;
      if (header.edited) {
        results.push({ path: variantPath, kind: pattern.exec(name)[1], status: 'stale' });
        return;
      }
      if (YAML.parse(text)?.variant?.of !== journey.name) return;
      fs.rmSync(variantPath);
      results.push({ path: variantPath, kind: pattern.exec(name)[1], status: 'removed' });
    });
  return results;
}

// Writes each variant to tests/journeys/_candidates/variants/
// <stem>-<kind>[-<n>].yaml, n counting variants of one kind when there are
// several. The same inputs give byte-identical files. A file someone edited
// since it was generated (a filled-in placeholder, a fix after a flaky
// replay) is kept, not overwritten. Earlier files of the run's kinds that
// this run no longer writes are removed when unedited. Returns each file as
// { path, kind, placeholder, status }, status one of written, kept (edited,
// left as it is), removed and stale (no longer generated, but edited).
function writeVariantFiles({ directories, filePath, journey, variants, kinds }) {
  const directory = path.join(directories.journeys, '_candidates', 'variants');
  const stem = path.basename(filePath, path.extname(filePath));
  const source = path.relative(directories.config, filePath);
  fs.mkdirSync(directory, { recursive: true });
  const counts = new Map();
  variants.forEach(({ kind }) => counts.set(kind, (counts.get(kind) ?? 0) + 1));
  const seen = new Map();
  const written = variants.map((variant) => {
    const n = (seen.get(variant.kind) ?? 0) + 1;
    seen.set(variant.kind, n);
    const suffix = counts.get(variant.kind) > 1 ? `-${n}` : '';
    const variantPath = path.join(directory, `${stem}-${variant.kind}${suffix}.yaml`);
    const text = renderVariant({ journey, variant, source });
    if (fs.existsSync(variantPath)) {
      const existing = fs.readFileSync(variantPath, 'utf8');
      const header = readVariantHeader(existing);
      if (existing !== text && (type.isNull(header) || header.edited)) {
        return { path: variantPath, kind: variant.kind, placeholder: false, status: 'kept' };
      }
    }
    fs.writeFileSync(variantPath, text);
    return {
      path: variantPath,
      kind: variant.kind,
      placeholder: !type.isUndefined(variant.comments),
      status: 'written',
    };
  });
  const stale = sweepStale({
    directory,
    stem,
    source,
    journey,
    kinds,
    written: new Set(written.map((file) => file.path)),
  });
  return [...written, ...stale];
}

export default writeVariantFiles;
