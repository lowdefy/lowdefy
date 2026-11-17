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

import { validate } from '@lowdefy/ajv';
import { type } from '@lowdefy/helpers';

import casesSchema from './casesSchema.js';
import fillCase from './fillCase.js';

const ONE_USER =
  'write a row per user, with user: { _case: user } and a user in each row, in place of a user list';

function findDuplicateName({ cases }) {
  const seen = new Set();
  return cases
    .map(({ name }) => name)
    .find((name) => {
      if (seen.has(name)) return true;
      seen.add(name);
      return false;
    });
}

// The runs of a journey with a `cases` table: one per row, the journey with `cases` left out,
// each `_case` filled in from the row (fillCase), named `<name> [<row name>]`. Returns { runs }
// or { error }. Each run has one user: a `user` list beside `cases`, or a `_case` that fills
// `user` with a list, is refused. validateJourney validates each run.
function expandCases({ journey }) {
  const { cases, ...written } = journey;
  try {
    validate({ schema: casesSchema, data: cases });
  } catch (error) {
    return { error: error.message };
  }
  const duplicate = findDuplicateName({ cases });
  if (!type.isUndefined(duplicate)) {
    return { error: `Journey "cases" has two rows named "${duplicate}"; row names are unique.` };
  }
  if (type.isArray(written.user)) {
    return { error: `Journey has "cases" and a list of users: ${ONE_USER}.` };
  }
  const runs = [];
  for (const row of cases) {
    const { value: filled, missing } = fillCase({ value: written, row });
    if (missing.length > 0) {
      return {
        error: `Journey case "${row.name}" has no ${missing
          .map((key) => `"${key}"`)
          .join(', ')} for _case to read.`,
      };
    }
    if (type.isArray(filled.user)) {
      return { error: `Journey case "${row.name}" fills user with a list: ${ONE_USER}.` };
    }
    runs.push({ ...filled, name: `${filled.name} [${row.name}]` });
  }
  return { runs };
}

export default expandCases;
