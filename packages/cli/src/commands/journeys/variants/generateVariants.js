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

import expandCases from '../../test/expandCases.js';
import generators, { ROW_GENERATORS } from './generators/index.js';

// A generator returns its variants, or { skipped } with a note, or { variants, skipped: [notes] }
// when it wrote some and skipped others.
function runGenerator({ generator, journey, exercised, inputs }) {
  const generated = generator({ journey, exercised, ...inputs });
  if (type.isArray(generated)) {
    return { variants: generated, notes: [] };
  }
  if (type.isNone(generated.skipped)) {
    return { variants: generated.variants ?? [], notes: [] };
  }
  const notes = type.isArray(generated.skipped) ? generated.skipped : [generated.skipped];
  return { variants: generated.variants ?? [], notes };
}

function rowLabel(rows) {
  const names = rows.map(({ name }) => name).join(', ');
  return rows.length === 1 ? `row ${names}` : `rows ${names}`;
}

// A row generator on a case-table journey: run on each row's journey (expandCases fills every
// `_case`, the user included), or on the first row's alone. A step the generator passed through
// from the row's journey is put back as the journey wrote it, `_case` placeholders and all. The
// same variant from several rows is kept once, and each variant carries the rows it came from as
// its `cases`, so it replays once per row and each row fills its own values. A variant from some
// of the rows names them in its detail, which keeps it apart from another row's variant of the
// same detail.
function generateByRow({ generator, rowsTaken, journey, runs, cases, exercised, inputs }) {
  const groups = new Map();
  const notes = new Map();
  const taken = rowsTaken === 'first' ? runs.slice(0, 1) : runs;
  taken.forEach((run, index) => {
    const row = cases[index];
    const generated = runGenerator({
      generator,
      journey: run,
      exercised,
      inputs: { ...inputs, caseTable: { journeyName: journey.name } },
    });
    generated.variants.forEach((variant) => {
      const steps = variant.steps.map((step) => {
        const at = run.steps.indexOf(step);
        return at === -1 ? step : journey.steps[at];
      });
      const generatedRow = { ...variant, steps };
      const key = JSON.stringify(generatedRow);
      if (!groups.has(key)) {
        groups.set(key, { variant: generatedRow, rows: [] });
      }
      groups.get(key).rows.push(row);
    });
    generated.notes.forEach((note) => {
      if (!notes.has(note)) notes.set(note, []);
      notes.get(note).push(row);
    });
  });
  const variants = [...groups.values()].map(({ variant, rows }) => ({
    ...variant,
    detail: rows.length === cases.length ? variant.detail : `${variant.detail}, ${rowLabel(rows)}`,
    overrides: { ...variant.overrides, cases: rows },
  }));
  return {
    variants,
    notes: [...notes.entries()].map(([note, rows]) =>
      rows.length === taken.length ? note : `${rowLabel(rows)}: ${note}`
    ),
  };
}

// The variants of each kind, in kind order, and the notes of what each kind skipped:
// { variants, skipped: [{ kind, note }] }. The generators read the journey as written, except
// those that read who it runs as (ROW_GENERATORS): a case-table journey's user is a `_case`
// placeholder, so they read each row's journey instead (generateByRow).
function generateVariants({ kinds, journey, exercised, inputs }) {
  const expanded = type.isUndefined(journey.cases) ? null : expandCases({ journey });
  const runs = expanded?.runs;
  const variants = [];
  const skipped = [];
  kinds.forEach((kind) => {
    generators[kind].forEach((generator) => {
      const rowsTaken = ROW_GENERATORS.get(generator);
      const generated =
        type.isUndefined(rowsTaken) || type.isNone(runs)
          ? runGenerator({ generator, journey, exercised, inputs })
          : generateByRow({
              generator,
              rowsTaken,
              journey,
              runs,
              cases: journey.cases,
              exercised,
              inputs,
            });
      variants.push(...generated.variants);
      generated.notes.forEach((note) => skipped.push({ kind, note }));
    });
  });
  return { variants, skipped };
}

export default generateVariants;
