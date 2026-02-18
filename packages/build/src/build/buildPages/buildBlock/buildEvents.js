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
import { ConfigError } from '@lowdefy/errors';
import createCheckDuplicateId from '../../../utils/createCheckDuplicateId.js';

function checkAction(
  action,
  {
    blockId,
    checkDuplicateActionId,
    context,
    eventId,
    linkActionRefs,
    pageId,
    requestActionRefs,
    typeCounters,
  }
) {
  const configKey = action['~k'];
  if (type.isUndefined(action.id)) {
    throw new ConfigError(
      `Action id missing on event "${eventId}" on block "${blockId}" on page "${pageId}".`,
      { configKey }
    );
  }
  if (!type.isString(action.id)) {
    throw new ConfigError(
      `Action id is not a string on event "${eventId}" on block "${blockId}" on page "${pageId}".`,
      { received: action.id, configKey }
    );
  }
  checkDuplicateActionId({
    id: action.id,
    configKey,
    eventId,
    blockId,
    pageId,
  });
  if (!type.isString(action.type)) {
    throw new ConfigError(
      `Action type is not a string on action "${action.id}" on event "${eventId}" on block "${blockId}" on page "${pageId}".`,
      { received: action.type, configKey }
    );
  }
  typeCounters.actions.increment(action.type, configKey);

  // Collect static Request action references for validation
  if (action.type === 'Request' && !type.isNone(action.params)) {
    const params = action.params;
    if (type.isString(params)) {
      requestActionRefs.push({ requestId: params, action, blockId, eventId });
    } else if (type.isArray(params)) {
      params.forEach((param) => {
        if (type.isString(param)) {
          requestActionRefs.push({ requestId: param, action, blockId, eventId });
        }
      });
    }
  }

  // Collect static Link action references for validation
  if (action.type === 'Link' && !type.isNone(action.params)) {
    const params = action.params;
    // Link params can be a string (pageId) or object with pageId property
    if (type.isString(params)) {
      linkActionRefs.push({ pageId: params, action, blockId, eventId, sourcePageId: pageId });
    } else if (type.isObject(params) && type.isString(params.pageId)) {
      linkActionRefs.push({
        pageId: params.pageId,
        action,
        blockId,
        eventId,
        sourcePageId: pageId,
      });
    }
  }
}

function buildEvents(block, pageContext) {
  const { context } = pageContext;
  if (block.events) {
    Object.keys(block.events).map((key) => {
      const eventConfigKey = block.events[key]?.['~k'] || block['~k'];
      if (
        (!type.isArray(block.events[key]) && !type.isObject(block.events[key])) ||
        (type.isObject(block.events[key]) && type.isNone(block.events[key].try))
      ) {
        throw new ConfigError(
          `Actions must be an array at "${block.blockId}" in event "${key}" on page "${pageContext.pageId}".`,
          { received: block.events[key]?.try, configKey: eventConfigKey }
        );
      }
      if (type.isArray(block.events[key])) {
        block.events[key] = {
          try: block.events[key],
          catch: [],
        };
      }
      if (!type.isArray(block.events[key].try)) {
        throw new ConfigError(
          `Try actions must be an array at "${block.blockId}" in event "${key}.try" on page "${pageContext.pageId}".`,
          { received: block.events[key].try, configKey: eventConfigKey }
        );
      }
      if (type.isNone(block.events[key].catch)) {
        block.events[key].catch = [];
      }
      if (!type.isArray(block.events[key].catch)) {
        throw new ConfigError(
          `Catch actions must be an array at "${block.blockId}" in event "${key}.catch" on page "${pageContext.pageId}".`,
          { received: block.events[key].catch, configKey: eventConfigKey }
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
          context,
          typeCounters: pageContext.typeCounters,
          pageId: pageContext.pageId,
          linkActionRefs: pageContext.linkActionRefs,
          requestActionRefs: pageContext.requestActionRefs,
          checkDuplicateActionId,
        })
      );
      block.events[key].catch.map((action) =>
        checkAction(action, {
          eventId: key,
          blockId: block.blockId,
          context,
          typeCounters: pageContext.typeCounters,
          pageId: pageContext.pageId,
          linkActionRefs: pageContext.linkActionRefs,
          requestActionRefs: pageContext.requestActionRefs,
          checkDuplicateActionId,
        })
      );
    });
  }
}

export default buildEvents;
