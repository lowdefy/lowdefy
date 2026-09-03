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

import describeValue from './describeValue.js';
import validateJourneySteps from './validateJourneySteps.js';
import { JOURNEY_KEYS } from './journeyGrammarKeys.js';

// The whole journey file, down to each step's params: a typo below the step key
// (`fill: title`) is a file-level error the CLI reports with its path, not a
// runtime failure the dev server discovers with a browser already open.
function validateJourney({ journey }) {
  if (!type.isObject(journey)) {
    return {
      valid: false,
      message: `Journey should be an object. Received ${describeValue(journey)}.`,
    };
  }
  const unknown = Object.keys(journey).filter((key) => !JOURNEY_KEYS.includes(key));
  if (unknown.length > 0) {
    return {
      valid: false,
      message: `Journey has unknown key "${unknown[0]}". Journey keys are: ${JOURNEY_KEYS.join(
        ', '
      )}.`,
    };
  }
  for (const key of ['name', 'pageId']) {
    if (type.isUndefined(journey[key])) {
      return { valid: false, message: `Journey should have required property "${key}".` };
    }
    if (!type.isString(journey[key])) {
      return {
        valid: false,
        message: `Journey "${key}" should be a string. Received ${describeValue(journey[key])}.`,
      };
    }
  }
  if (
    !type.isUndefined(journey.user) &&
    !type.isString(journey.user) &&
    !type.isObject(journey.user)
  ) {
    return {
      valid: false,
      message: `Journey "user" should be a dev user name (string) or an inline user object. Received ${describeValue(
        journey.user
      )}.`,
    };
  }
  if (!type.isUndefined(journey.urlQuery) && !type.isObject(journey.urlQuery)) {
    return {
      valid: false,
      message: `Journey "urlQuery" should be an object. Received ${describeValue(
        journey.urlQuery
      )}.`,
    };
  }
  // The fixtures a journey needs before its page opens, by file name, in the
  // order they are inserted - the same list a request test names.
  if (!type.isUndefined(journey.fixtures)) {
    if (!type.isArray(journey.fixtures) || journey.fixtures.some((name) => !type.isString(name))) {
      return {
        valid: false,
        message: `Journey "fixtures" should be an array of fixture names. Received ${describeValue(
          journey.fixtures
        )}.`,
      };
    }
  }
  if (type.isUndefined(journey.steps)) {
    return { valid: false, message: 'Journey should have required property "steps".' };
  }
  const { error } = validateJourneySteps({ steps: journey.steps });
  if (!type.isUndefined(error)) {
    return { valid: false, message: error };
  }
  if (journey.steps.length === 0) {
    return { valid: false, message: 'Journey "steps" should have at least one step.' };
  }
  return { valid: true };
}

export default validateJourney;
