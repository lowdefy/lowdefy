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
import {
  findStepNeedingPage,
  validateJourneySteps,
  validateJourneyTags,
  validateJourneyUser,
} from '@lowdefy/node-utils';

import describeStep from './lint/describeStep.js';
import journeySchema from './journeySchema.js';

// ajv cannot compare two fields, so the one cross-field rule of the evidence
// key is checked here.
function checkMutationCounts({ evidence }) {
  const mutation = evidence?.mutation;
  if (type.isNone(mutation) || mutation.killed <= mutation.total) return undefined;
  return `Journey "evidence.mutation.killed" (${mutation.killed}) should not be more than "evidence.mutation.total" (${mutation.total}).`;
}

// A journey opens its pageId before its first step; one with no pageId opens
// no page, so each of its steps must run without one.
function checkPageId({ journey }) {
  if (!type.isUndefined(journey.pageId)) return undefined;
  const found = findStepNeedingPage({ steps: journey.steps });
  if (type.isUndefined(found)) return undefined;
  return `Journey should have required property "pageId": ${describeStep(
    found
  )} needs a page. A journey with no pageId runs only call, request, as, wait: { ms } and expect on error, status, calls (with a pageId for a request) or db.`;
}

function validateJourney({ journey }) {
  try {
    validate({ schema: journeySchema, data: journey });
  } catch (error) {
    return { valid: false, message: error.message };
  }
  const mutationError = checkMutationCounts({ evidence: journey.evidence });
  if (!type.isUndefined(mutationError)) {
    return { valid: false, message: mutationError };
  }
  const { error: userError } = validateJourneyUser({ user: journey.user, data: journey.data });
  if (!type.isUndefined(userError)) {
    return { valid: false, message: userError };
  }
  if (!type.isUndefined(journey.tags)) {
    const { error: tagsError } = validateJourneyTags({ tags: journey.tags });
    if (!type.isUndefined(tagsError)) {
      return { valid: false, message: `Journey "tags": ${tagsError}` };
    }
  }
  // The ajv shape check above names the file's broken key; the grammar names
  // the broken step, before a dev server is started for it.
  const { error } = validateJourneySteps({ steps: journey.steps });
  if (!type.isUndefined(error)) {
    return { valid: false, message: error };
  }
  const pageIdError = checkPageId({ journey });
  if (!type.isUndefined(pageIdError)) {
    return { valid: false, message: pageIdError };
  }
  return { valid: true };
}

export default validateJourney;
