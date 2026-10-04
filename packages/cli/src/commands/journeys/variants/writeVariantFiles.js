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
import readVariantOwnership from './readVariantOwnership.js';
import writeVariantHeader from './writeVariantHeader.js';

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

// The journey file's path relative to tests/journeys/ (or to the config
// directory, for a file outside it) without its extension, as segments, so
// two files with one stem in different folders never share a folder.
function sourceSegments({ directories, filePath }) {
  const fromJourneys = path.relative(directories.journeys, filePath);
  const inJourneys = !fromJourneys.startsWith('..') && !path.isAbsolute(fromJourneys);
  const relative = inJourneys ? fromJourneys : path.relative(directories.config, filePath);
  const parsed = path.parse(relative);
  return [...parsed.dir.split(path.sep).filter((segment) => segment !== ''), parsed.name];
}

// Lower case, each run of other characters one `-`, so the journeys of one
// file never share a file.
function slugJourneyName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Variant files of this journey and these kinds from an earlier run that
// this run did not write: removed when left as generated, else reported.
// A file this run does not own (another source file, or another journey
// whose name gives the same slug) is left alone.
function sweepStale({ directory, slug, source, journey, kinds, written }) {
  const pattern = new RegExp(
    `^${escapeRegExp(slug)}-(${kinds.map(escapeRegExp).join('|')})(-\\d+)?\\.yaml$`
  );
  const results = [];
  fs.readdirSync(directory)
    .filter((name) => pattern.test(name))
    .sort()
    .forEach((name) => {
      const variantPath = path.join(directory, name);
      if (written.has(variantPath)) return;
      const text = fs.readFileSync(variantPath, 'utf8');
      const ownership = readVariantOwnership({ text, source, journey });
      if (!ownership.owned) return;
      const kind = pattern.exec(name)[1];
      if (ownership.edited) {
        results.push({ path: variantPath, kind, status: 'stale' });
        return;
      }
      fs.rmSync(variantPath);
      results.push({ path: variantPath, kind, status: 'removed' });
    });
  return results;
}

// Writes each variant to tests/journeys/_candidates/variants/<source>/
// <journey>-<kind>[-<n>].yaml: <source> the journey file's path without its
// extension, <journey> a slug of the journey's name, n counting variants of
// one kind when there are several. The same inputs give byte-identical
// files. A file belongs to the source its header names and the journey its
// variant.of names. Only an unedited file this run owns is overwritten: one
// someone edited since it was generated (a filled-in placeholder, a fix
// after a flaky replay) is kept, and one another source or journey owns (two
// names that give one slug) is left alone and reported. Earlier files of the
// run's kinds that this run owns and no longer writes are removed when
// unedited. Returns each file as { path, kind, placeholder, status }, status
// one of written, kept (edited, left as it is), conflict (owned by another
// source or journey, with owner { source, name }), removed and stale (no
// longer generated, but edited).
function writeVariantFiles({ directories, filePath, journey, variants, kinds }) {
  const directory = path.join(
    directories.journeys,
    '_candidates',
    'variants',
    ...sourceSegments({ directories, filePath })
  );
  const slug = slugJourneyName(journey.name);
  // Forward slashes, so a file generated on Windows matches one generated anywhere else.
  const source = path.relative(directories.config, filePath).split(path.sep).join('/');
  fs.mkdirSync(directory, { recursive: true });
  const counts = new Map();
  variants.forEach(({ kind }) => counts.set(kind, (counts.get(kind) ?? 0) + 1));
  const seen = new Map();
  const written = variants.map((variant) => {
    const n = (seen.get(variant.kind) ?? 0) + 1;
    seen.set(variant.kind, n);
    const suffix = counts.get(variant.kind) > 1 ? `-${n}` : '';
    const variantPath = path.join(directory, `${slug}-${variant.kind}${suffix}.yaml`);
    if (fs.existsSync(variantPath)) {
      const ownership = readVariantOwnership({
        text: fs.readFileSync(variantPath, 'utf8'),
        source,
        journey,
      });
      if (!ownership.owned) {
        return {
          path: variantPath,
          kind: variant.kind,
          placeholder: false,
          status: 'conflict',
          owner: { source: ownership.source, name: ownership.name },
        };
      }
      if (ownership.edited) {
        return { path: variantPath, kind: variant.kind, placeholder: false, status: 'kept' };
      }
    }
    fs.writeFileSync(variantPath, renderVariant({ journey, variant, source }));
    return {
      path: variantPath,
      kind: variant.kind,
      placeholder: !type.isUndefined(variant.comments),
      status: 'written',
    };
  });
  const stale = sweepStale({
    directory,
    slug,
    source,
    journey,
    kinds,
    written: new Set(written.map((file) => file.path)),
  });
  return [...written, ...stale];
}

export default writeVariantFiles;
