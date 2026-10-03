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
import { validateJourneySteps } from '@lowdefy/node-utils';

import journeySchema from './journeySchema.js';

function validateJourney({ journey }) {
  try {
    validate({ schema: journeySchema, data: journey });
  } catch (error) {
    return { valid: false, message: error.message };
  }
  // The ajv shape check above names the file's broken key; the grammar names
  // the broken step, before a dev server is started for it.
  const { error } = validateJourneySteps({ steps: journey.steps });
  if (!type.isUndefined(error)) {
    return { valid: false, message: error };
  }
  return { valid: true };
}

export default validateJourney;
