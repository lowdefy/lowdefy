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
import { findPlaceholderStep } from '@lowdefy/node-utils';

import validateJourney from './validateJourney.js';

// The result for a discovered journey no runner can take, or undefined when it can run: a file
// that did not parse, a journey the schema or grammar refuses, or a placeholder step. Refused
// results are not repeated, since every repeat would be refused the same way.
function checkJourneyItem({ item }) {
  const { filePath, journey } = item;
  const name = journey?.name ?? filePath;
  if (!type.isNone(item.error)) {
    return {
      name,
      filePath,
      passed: false,
      refused: true,
      stepCount: 0,
      durationMs: 0,
      message: item.error,
    };
  }
  // A persona run is named `<name> [<user>]`; the name limit applies to the
  // name as authored, which expandPersonas validated, never to the run name.
  const validation = validateJourney({
    journey: type.isNone(item.personaOf) ? journey : { ...journey, name: item.personaOf.name },
  });
  if (!validation.valid) {
    return {
      name,
      filePath,
      passed: false,
      refused: true,
      stepCount: 0,
      durationMs: 0,
      message: `Invalid journey file: ${validation.message}`,
    };
  }
  // The dev server refuses a placeholder too; checking here reports it without
  // the round trip.
  const { error: placeholderError } = findPlaceholderStep({ steps: journey.steps });
  if (!type.isUndefined(placeholderError)) {
    return {
      name,
      filePath,
      passed: false,
      stepCount: journey.steps.length,
      durationMs: 0,
      message: placeholderError,
    };
  }
  return undefined;
}

export default checkJourneyItem;
