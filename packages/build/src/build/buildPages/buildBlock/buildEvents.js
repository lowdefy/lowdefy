/*
  Copyright 2020-2024 Lowdefy, Inc

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
import createCheckDuplicateId from '../../../utils/createCheckDuplicateId.js';

function checkAction(action, { blockId, checkDuplicateActionId, eventId, pageId, typeCounters }) {
  if (type.isUndefined(action.id)) {
    throw new Error(
      `Action id missing on event "${eventId}" on block "${blockId}" on page "${pageId}".`
    );
  }
  if (!type.isString(action.id)) {
    throw new Error(
      `Action id is not a string on event "${eventId}" on block "${blockId}" on page "${pageId}". Received ${JSON.stringify(
        action.id
      )}.`
    );
  }
  checkDuplicateActionId({
    id: action.id,
    eventId,
    blockId,
    pageId,
  });
  if (!type.isString(action.type)) {
    throw new Error(
      `Action type is not a string on action "${
        action.id
      }" on event "${eventId}" on block "${blockId}" on page "${pageId}". Received ${JSON.stringify(
        action.type
      )}.`
    );
  }
  typeCounters.actions.increment(action.type);
}

function buildEvents(block, pageContext) {
  if (block.events) {
    Object.keys(block.events).map((key) => {
      if (
        (!type.isArray(block.events[key]) && !type.isObject(block.events[key])) ||
        (type.isObject(block.events[key]) && type.isNone(block.events[key].try))
      ) {
        throw new Error(
          `Actions must be an array at "${block.blockId}" in event "${key}" on page "${
            pageContext.pageId
          }". Received ${JSON.stringify(block.events[key].try)}`
        );
      }
      if (type.isArray(block.events[key])) {
        block.events[key] = {
          try: block.events[key],
          catch: [],
        };
      }
      if (!type.isArray(block.events[key].try)) {
        throw new Error(
          `Try actions must be an array at "${block.blockId}" in event "${key}.try" on page "${
            pageContext.pageId
          }". Received ${JSON.stringify(block.events[key].try)}`
        );
      }
      if (type.isNone(block.events[key].catch)) {
        block.events[key].catch = [];
      }
      if (!type.isArray(block.events[key].catch)) {
        throw new Error(
          `Catch actions must be an array at "${block.blockId}" in event "${key}.catch" on page "${
            pageContext.pageId
          }". Received ${JSON.stringify(block.events[key].catch)}`
        );
      }
      const checkDuplicateActionId = createCheckDuplicateId({
        message:
          'Duplicate actionId "{{ id }}" on event "{{ eventId }}" on block "{{ blockId }}" on page "{{ pageId }}".',
      });
      block.events[key].try.map((action) =>
        checkAction(action, {
          eventId: key,
          blockId: block.blockId,
          typeCounters: pageContext.typeCounters,
          pageId: pageContext.pageId,
          checkDuplicateActionId,
        })
      );
      block.events[key].catch.map((action) =>
        checkAction(action, {
          eventId: key,
          blockId: block.blockId,
          typeCounters: pageContext.typeCounters,
          pageId: pageContext.pageId,
          checkDuplicateActionId,
        })
      );
    });
  }
}

export default buildEvents;
