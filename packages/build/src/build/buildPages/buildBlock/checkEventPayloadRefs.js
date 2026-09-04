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

import { getSchemaAtPath } from '@lowdefy/ajv';
import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

import collectExceptions from '../../../utils/collectExceptions.js';
import findSimilarString from '../../../utils/findSimilarString.js';
import traverseConfig from '../../../utils/traverseConfig.js';

// The _event operator reads a path as a string, or as { key } in the object
// form. Every other form (true for the whole event, an integer index, a key
// supplied by another operator) names no path the build can check.
function getEventPath(params) {
  if (type.isString(params)) return params;
  if (type.isObject(params) && type.isString(params.key)) return params.key;
  return null;
}

function suggestPath({ path, segment, candidates }) {
  const suggestion = findSimilarString({ input: segment, candidates });
  if (!suggestion) return '';
  const segments = path.split(/\.|\[|\]/).filter((part) => part !== '');
  const index = segments.indexOf(segment);
  const suggestedPath = [...segments.slice(0, index), suggestion, ...segments.slice(index + 1)];
  return ` Did you mean "${suggestedPath.join('.')}"?`;
}

// Checks every _event reference inside one event (try, catch, messages, control
// branches) against the payload schema the block type declares for it. Called
// only for events with a declared payload - an event without one is the opt-in
// boundary that keeps third-party blocks working.
function checkEventPayloadRefs({ block, context, event, eventConfigKey, eventName, payload }) {
  const payloadKeys = type.isObject(payload.properties) ? Object.keys(payload.properties) : [];
  traverseConfig({
    config: event,
    visitor: (obj) => {
      if (obj._event === undefined) return;
      const path = getEventPath(obj._event);
      if (path === null) return;
      const result = getSchemaAtPath({ schema: payload, path, explain: true });
      if (result.resolved) return;
      const payloadList = payloadKeys.length > 0 ? payloadKeys.join(', ') : 'none';
      // Collected, not thrown, so every bad path in the event is reported in
      // one build and the rest of the block still builds.
      collectExceptions(
        context,
        new ConfigError(
          `_event "${path}" in event "${eventName}" on block "${block.blockId}" (${
            block.type
          }) is not in the event payload. Payload: ${payloadList}.${suggestPath({
            path,
            ...result,
          })}`,
          { configKey: obj['~k'] ?? eventConfigKey, checkSlug: 'event-payload' }
        )
      );
    },
  });
}

export default checkEventPayloadRefs;
